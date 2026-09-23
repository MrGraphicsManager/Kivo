import React, { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth, getPersistentSubscription } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { 
  Smartphone, 
  CheckCircle2, 
  ArrowRight, 
  RotateCw, 
  ShieldCheck, 
  AlertCircle, 
  PhoneCall, 
  Edit3, 
  MessageCircle 
} from "lucide-react";
import Card3D from "@/components/Card3D";
import ThreeDBackground from "@/components/ThreeDBackground";
import { auth, RecaptchaVerifier, signInWithPhoneNumber } from "@/lib/firebase";

export default function VerifyPhone() {
  const { user, sendPhoneOtp, verifyPhoneOtp } = useAuth();
  const [params] = useSearchParams();
  const nav = useNavigate();

  const emailParam = params.get("email") || user?.email || "";
  const initialPhone = user?.phone ? user.phone.replace(/\D/g, "").slice(-10) : "";

  const [email] = useState(emailParam);
  const [phone, setPhone] = useState(initialPhone);
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState(1); // 1: Enter Phone, 2: Enter OTP, 3: Verified
  const [busy, setBusy] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [err, setErr] = useState("");
  const [demoOtp, setDemoOtp] = useState("");
  const [smsActive, setSmsActive] = useState(false);

  const checkHasActiveSub = () => {
    const s = user?.subscription || getPersistentSubscription(email);
    if (!s) return false;
    const st = (s.status || "").toLowerCase();
    const active = st === "active" || st === "trial" || s.is_trial === true;
    if (!active) return false;
    if (!s.expires_at) return true;
    const exp = new Date(s.expires_at).getTime();
    return !isNaN(exp) && exp > Date.now();
  };

  // Countdown timer for resend
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  // If user already verified phone and has active subscription, redirect
  useEffect(() => {
    if (user?.phone_verified && (user?.subscription?.status === "active" || user?.subscription?.status === "trial")) {
      nav("/app");
    }
  }, [user, nav]);

  const setupRecaptcha = () => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
        size: "invisible",
        callback: () => {}
      });
    }
  };

  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    const cleanPhone = phone.replace(/\D/g, "").slice(-10);
    if (!cleanPhone || cleanPhone.length !== 10) {
      setErr("Please enter a valid 10-digit Indian mobile number.");
      return;
    }

    setBusy(true);
    setErr("");

    let realSmsSent = false;
    try {
      setupRecaptcha();
      const confirmationResult = await signInWithPhoneNumber(auth, `+91${cleanPhone}`, window.recaptchaVerifier);
      window.confirmationResult = confirmationResult;
      realSmsSent = true;
    } catch (fbErr) {
      console.warn("Firebase Phone Auth notice:", fbErr?.message || fbErr);
      if (window.recaptchaVerifier) {
        try { window.recaptchaVerifier.clear(); } catch (_) {}
        window.recaptchaVerifier = null;
      }
    }

    // Always dispatch through our backend as well for sync/email
    const res = await sendPhoneOtp(cleanPhone, email);
    setBusy(false);

    if (realSmsSent || res.ok) {
      setStep(2);
      setCooldown(45);
      if (res.demo_otp) {
        setDemoOtp(res.demo_otp);
      }
      setSmsActive(realSmsSent || Boolean(res.sms_gateway_active));
      if (realSmsSent) {
        toast.success(`Real SMS sent to +91 ${cleanPhone} via Google! Check your phone.`);
      } else {
        toast.info(`OTP generated and sent to ${email || 'your email'}`);
      }
    } else {
      setErr(res.error || "Failed to dispatch OTP. Please try again.");
      toast.error(res.error || "Failed to dispatch OTP.");
    }
  };

  const handleVerifyOtp = async (e) => {
    if (e) e.preventDefault();
    const cleanPhone = phone.replace(/\D/g, "").slice(-10);
    const cleanOtp = otp.trim();

    if (!cleanPhone || cleanPhone.length !== 10) {
      setErr("Please enter a valid 10-digit mobile number.");
      return;
    }
    if (!cleanOtp || cleanOtp.length < 6) {
      setErr("Please enter the complete 6-digit OTP.");
      return;
    }

    setBusy(true);
    setErr("");

    let firebaseVerified = false;
    if (window.confirmationResult) {
      try {
        await window.confirmationResult.confirm(cleanOtp);
        firebaseVerified = true;
      } catch (fbErr) {
        console.warn("Firebase code verification notice:", fbErr?.message);
      }
    }

    const res = await verifyPhoneOtp(cleanPhone, cleanOtp, email);
    setBusy(false);

    if (res.ok || firebaseVerified) {
      setStep(3);
      const verifiedUser = res.user || user;
      const sub = verifiedUser?.subscription || getPersistentSubscription(email);
      const hasSub = (sub && (sub.status === "active" || sub.status === "trial" || sub.is_trial === true) && (!sub.expires_at || new Date(sub.expires_at).getTime() > Date.now()));
      if (hasSub) {
        toast.success("Mobile number verified successfully! Accessing your store dashboard...");
        setTimeout(() => {
          nav("/app");
        }, 1500);
      } else {
        toast.success("Mobile number verified successfully! Please choose your subscription plan.");
        setTimeout(() => {
          nav("/subscribe");
        }, 1500);
      }
    } else {
      setErr(res.error || "Invalid OTP. Please check the 6-digit code and try again.");
      toast.error(res.error || "Invalid OTP code.");
    }
  };

  const handleResend = async () => {
    const cleanPhone = phone.replace(/\D/g, "").slice(-10);
    if (!cleanPhone || cleanPhone.length !== 10) {
      toast.error("Please enter a valid mobile number.");
      return;
    }
    setResending(true);
    setErr("");

    let realSmsSent = false;
    try {
      setupRecaptcha();
      const confirmationResult = await signInWithPhoneNumber(auth, `+91${cleanPhone}`, window.recaptchaVerifier);
      window.confirmationResult = confirmationResult;
      realSmsSent = true;
    } catch (fbErr) {
      console.warn("Firebase Phone Auth notice on resend:", fbErr?.message || fbErr);
    }

    const res = await sendPhoneOtp(cleanPhone, email);
    setResending(false);

    if (realSmsSent || res.ok) {
      setCooldown(45);
      if (res.demo_otp) {
        setDemoOtp(res.demo_otp);
      }
      setSmsActive(realSmsSent || Boolean(res.sms_gateway_active));
      toast.success("A fresh OTP has been generated!");
    } else {
      toast.error(res.error || "Failed to resend OTP.");
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#F8FAFC] text-slate-900 font-sans selection:bg-blue-600/20 selection:text-blue-700 flex flex-col justify-between">
      
      {/* Ambient glowing blooms */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[450px] bg-gradient-to-b from-blue-400/10 via-indigo-400/5 to-transparent blur-[120px] rounded-full" />
        <div className="absolute top-[40%] right-[-10%] w-[500px] h-[500px] bg-purple-400/10 blur-[140px] rounded-full" />
      </div>

      {/* Top Brand Header */}
      <header className="relative z-20 max-w-7xl mx-auto w-full px-6 py-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="flex items-center px-1.5 py-0.5 rounded-xl group-hover:scale-105 transition-transform">
            <img 
              src="/kivo-logo.png" 
              alt="Kivo" 
              className="h-7 sm:h-8 w-auto object-contain" 
            />
          </div>
          <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase tracking-widest bg-blue-50 text-blue-700 border border-blue-200">
            Retail OS
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <Link 
            to="/login" 
            className="text-xs font-bold px-4 py-2 rounded-full border border-slate-300 text-slate-700 hover:border-blue-600 hover:text-blue-600 bg-white hover:bg-slate-50 shadow-xs active:scale-95 transition-all"
          >
            Back to Sign In
          </Link>
        </div>
      </header>

      {/* Verification Card Stage */}
      <main className="relative z-20 max-w-md mx-auto w-full px-6 py-6 my-auto">
        <Card3D depth={12}>
          <div className="bg-white p-8 sm:p-10 rounded-3xl border border-slate-200 shadow-2xl relative overflow-hidden">
            
            {/* Invisible Google reCAPTCHA Container */}
            <div id="recaptcha-container"></div>

            {/* Top Accent Strip */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-sky-500 to-indigo-600" />

            {/* STEP 3: SUCCESS STATE */}
            {step === 3 && (
              <div className="text-center py-6 space-y-4">
                <div className="w-16 h-16 mx-auto rounded-3xl bg-emerald-50 text-emerald-600 border border-emerald-200 grid place-items-center shadow-xs">
                  <CheckCircle2 className="w-9 h-9 animate-bounce" />
                </div>
                <h2 className="font-display text-2xl font-bold text-slate-900">
                  Mobile Verified!
                </h2>
                <p className="text-xs text-slate-600 font-medium">
                  {checkHasActiveSub() 
                    ? "Your phone number is confirmed. Redirecting you to your store dashboard..."
                    : "Your phone number is confirmed. Redirecting you to choose your subscription plan..."
                  }
                </p>
                <div className="pt-2">
                  <Button
                    onClick={() => nav(checkHasActiveSub() ? "/app" : "/subscribe")}
                    className="w-full h-11 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs shadow-lg shadow-blue-600/25 cursor-pointer"
                  >
                    {checkHasActiveSub() ? "Open Dashboard" : "Continue to Plans"} <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 1: PHONE NUMBER INPUT */}
            {step === 1 && (
              <div>
                <div className="text-center mb-6">
                  <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-blue-50 text-blue-600 grid place-items-center border border-blue-200">
                    <Smartphone className="w-7 h-7" />
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-[10px] font-bold text-blue-700 mb-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                    <span>Step 2 of 3: Mobile Verification</span>
                  </div>
                  <h2 className="font-display text-2xl font-bold text-slate-900">
                    Verify Your Phone
                  </h2>
                  <p className="text-xs text-slate-500 font-medium mt-1">
                    Enter your 10-digit mobile number to receive your 6-digit OTP.
                  </p>
                  {email && (
                    <p className="text-[11px] font-mono text-slate-400 mt-1">
                      Account: {email}
                    </p>
                  )}
                </div>

                {err && (
                  <div className="mb-4 p-3.5 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-700 font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                    <span>{err}</span>
                  </div>
                )}

                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div className="text-left">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 block mb-1">
                      Mobile Number
                    </label>
                    <div className="relative flex items-center">
                      <div className="absolute left-3.5 flex items-center gap-1 text-slate-500 text-sm font-bold pointer-events-none select-none">
                        <span>🇮🇳 +91</span>
                        <span className="text-slate-300">|</span>
                      </div>
                      <Input
                        type="tel"
                        maxLength={10}
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                        placeholder="98765 43210"
                        className="h-12 pl-24 text-base font-bold tracking-wider rounded-2xl border border-slate-200 focus:border-blue-600 focus:bg-white text-slate-900 bg-slate-50"
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">
                      We will send a 6-digit verification code via SMS & dual email alert.
                    </p>
                  </div>

                  <Button
                    type="submit"
                    disabled={busy || phone.length < 10}
                    className="w-full h-12 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold shadow-lg shadow-blue-600/25 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {busy ? "Sending 6-Digit OTP..." : "Send Verification Code"}
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </form>

                <div className="mt-6 pt-5 border-t border-slate-200 text-center">
                  <p className="text-[11px] text-slate-400">
                    By continuing, you verify that this mobile number is active and owned by you.
                  </p>
                </div>
              </div>
            )}

            {/* STEP 2: 6-DIGIT OTP VERIFICATION */}
            {step === 2 && (
              <div>
                <div className="text-center mb-6">
                  <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-blue-50 text-blue-600 grid place-items-center border border-blue-200">
                    <PhoneCall className="w-7 h-7" />
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-[10px] font-bold text-blue-700 mb-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                    <span>Enter 6-Digit Code</span>
                  </div>
                  <h2 className="font-display text-2xl font-bold text-slate-900">
                    Verify OTP
                  </h2>
                  <p className="text-xs text-slate-500 font-medium mt-1">
                    We've sent a 6-digit code to:
                  </p>
                  <div className="inline-flex items-center gap-2 mt-1">
                    <span className="text-xs font-bold font-mono text-blue-600">
                      +91 {phone.slice(0, 5)} {phone.slice(5)}
                    </span>
                    <button
                      type="button"
                      onClick={() => { setStep(1); setOtp(""); setErr(""); }}
                      className="text-[11px] text-slate-400 hover:text-blue-600 flex items-center gap-0.5 underline font-medium cursor-pointer"
                    >
                      <Edit3 className="w-3 h-3" /> Edit
                    </button>
                  </div>
                </div>

                {demoOtp && (
                  <div className="mb-4 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-left">
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">
                        {smsActive ? "SMS Dispatched" : "OTP Code"}
                      </span>
                      {email && (
                        <span className="text-[10px] font-medium text-amber-600 truncate max-w-[180px]">
                          Backup sent to {email}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200">
                      <span className="font-mono font-black text-2xl tracking-[0.35em] text-emerald-600 pl-2 select-all">
                        {demoOtp}
                      </span>
                      <div className="flex items-center gap-2">
                        <a
                          href={`https://wa.me/91${phone}?text=${encodeURIComponent(`Your Kivo verification OTP is ${demoOtp}. Valid for 10 minutes.`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold text-[11px] transition-all"
                        >
                          <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="hidden sm:inline">WhatsApp</span>
                        </a>
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => setOtp(demoOtp)}
                          className="h-8 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shrink-0 cursor-pointer shadow-xs"
                        >
                          Auto-fill
                        </Button>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-2 leading-tight flex items-center justify-between">
                      <span>Instant 100% Free Verification · Code delivered to email & screen</span>
                    </p>
                  </div>
                )}

                {err && (
                  <div className="mb-4 p-3.5 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-700 font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                    <span>{err}</span>
                  </div>
                )}

                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div className="text-left">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 block mb-1 text-center">
                      Enter 6-Digit Mobile OTP
                    </label>
                    <Input
                      type="text"
                      maxLength={6}
                      autoFocus
                      required
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                      placeholder="• • • • • •"
                      className="h-14 text-center text-2xl font-bold font-mono tracking-widest rounded-2xl border border-slate-200 focus:border-blue-600 text-slate-900 bg-slate-50"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={busy || otp.length < 6}
                    className="w-full h-12 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold shadow-lg shadow-blue-600/25 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {busy ? "Verifying OTP..." : "Verify Mobile & Continue"}
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </form>

                <div className="mt-6 pt-5 border-t border-slate-200 text-center space-y-2">
                  <p className="text-xs text-slate-500">
                    Didn't receive the OTP SMS?
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={resending || cooldown > 0}
                    onClick={handleResend}
                    className="rounded-full border border-slate-300 text-xs font-bold text-slate-700 hover:text-blue-600 hover:border-blue-600 bg-white cursor-pointer"
                  >
                    <RotateCw className={`w-3.5 h-3.5 mr-1.5 ${resending ? "animate-spin" : ""}`} />
                    {cooldown > 0 ? `Resend OTP in ${cooldown}s` : "Resend OTP"}
                  </Button>
                </div>
              </div>
            )}

          </div>
        </Card3D>
      </main>

      {/* Footer */}
      <footer className="relative z-20 max-w-7xl mx-auto w-full px-6 py-4 text-center text-xs text-slate-400">
        Kivo Retail OS · Business Made Simple · © 2026
      </footer>

    </div>
  );
}
