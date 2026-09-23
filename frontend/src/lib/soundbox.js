// Dukaan Virtual Soundbox (Browser Audio Synthesis & Chime)
// Speaks: "Dukaan: Received ₹X via UPI / Cash!"

let sharedAudioCtx = null;

export function unlockAudioContext() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    if (!sharedAudioCtx) {
      sharedAudioCtx = new AudioCtx();
    }
    if (sharedAudioCtx.state === "suspended") {
      sharedAudioCtx.resume();
    }
  } catch (_) {}
}

if (typeof window !== "undefined") {
  const handleInteraction = () => {
    unlockAudioContext();
    window.removeEventListener("pointerdown", handleInteraction);
    window.removeEventListener("keydown", handleInteraction);
  };
  window.addEventListener("pointerdown", handleInteraction, { passive: true, once: true });
  window.addEventListener("keydown", handleInteraction, { passive: true, once: true });
}

function playChime() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = sharedAudioCtx || new AudioCtx();
    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    // Pleasant dual chime (D5 -> A5)
    osc.frequency.setValueAtTime(587.33, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12);

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch (_) {
    // Graceful fallback if audio context fails
  }
}

export function playVoiceSoundbox(amount, method = "upi", lang = "hi") {
  try {
    unlockAudioContext();
    // Play soundbox bell first
    playChime();

    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();

    const cleanAmount = Math.round(Number(amount || 0));
    const modeText = method === "upi" ? "UPI" : method === "cash" ? "Cash" : "Credit";

    let text = `Kivo: Received ${cleanAmount} rupees via ${modeText}!`;
    let speechLang = "en-IN";

    const normalizedLang = (lang || "").toLowerCase();
    if (normalizedLang === "hi" || normalizedLang === "hindi") {
      text = `किवो: ${cleanAmount} रुपये प्राप्त हुए!`;
      speechLang = "hi-IN";
    } else if (normalizedLang === "gu" || normalizedLang === "gujarati") {
      text = `કિવો: ${cleanAmount} રૂપિયા પ્રાપ્ત થયા!`;
      speechLang = "gu-IN";
    } else if (normalizedLang === "mr" || normalizedLang === "marathi") {
      text = `किवो: ${cleanAmount} रुपये जमा झाले!`;
      speechLang = "mr-IN";
    } else if (normalizedLang === "ta" || normalizedLang === "tamil") {
      text = `கிவோ: ${cleanAmount} ரூபாய் பெறப்பட்டது!`;
      speechLang = "ta-IN";
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = speechLang;
    utterance.rate = 0.95;
    utterance.pitch = 1.05;

    // Small delay after chime
    setTimeout(() => {
      try {
        window.speechSynthesis.speak(utterance);
      } catch (_) {}
    }, 350);
  } catch (err) {
    console.warn("Soundbox voice synthesis error:", err);
  }
}
