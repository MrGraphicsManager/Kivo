import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { toast } from "sonner";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const OFFICIAL_GOOGLE_CLIENT_ID = "682420913410-dfarb0n3e5a44vsh32fh1hh5j4ig0n6r.apps.googleusercontent.com";

export default function SocialAuthButtons({ mode = "login", onSuccess }) {
  const { loginWithApple } = useAuth();
  const nav = useNavigate();
  const [busyProvider, setBusyProvider] = useState(null);
  const [showApplePrompt, setShowApplePrompt] = useState(false);
  const [appleEmail, setAppleEmail] = useState("");
  const [appleName, setAppleName] = useState("");

  // Real Google OAuth 2.0 API Launch
  const handleGoogleClick = () => {
    setBusyProvider("google");
    try {
      const clientId =
        (process.env.REACT_APP_GOOGLE_CLIENT_ID || OFFICIAL_GOOGLE_CLIENT_ID).trim();

      const redirectUri = `${window.location.origin}/auth/google/callback`;
      const state = Math.random().toString(36).substring(2) + Date.now().toString(36);
      const nonce = String(Date.now());

      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: "token id_token",
        scope: "openid email profile https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile",
        prompt: "select_account",
        nonce: nonce,
        state: state,
      });

      // Strict RFC 6749 encoding (%20 instead of + for response_type and scopes)
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString().replace(/\+/g, "%20")}`;

      // Directly redirect to real accounts.google.com
      window.location.href = authUrl;
    } catch (e) {
      toast.error("Failed to initialize Google authentication.");
      setBusyProvider(null);
    }
  };

  const handleAppleClick = () => {
    toast.info("Apple sign-in is temporarily unavailable until secure Apple OAuth is configured.");
  };

  const submitAppleAuth = async (e) => {
    if (e) e.preventDefault();
    const cleanEmail = (appleEmail || "").trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      return toast.error("Please enter a valid Apple ID email address.");
    }

    setBusyProvider("apple");
    setShowApplePrompt(false);

    try {
      const generatedName =
        (appleName || "").trim() ||
        cleanEmail
          .split("@")[0]
          .replace(/[._]/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase());

      const res = await loginWithApple({
        email: cleanEmail,
        name: generatedName,
        provider: "apple",
      });

      if (res.ok) {
        let sub = res.user?.subscription;
        if (!sub) {
          try {
            const localUser = JSON.parse(localStorage.getItem("dukaan_user") || "{}");
            sub = localUser.subscription;
          } catch {}
        }
        const isSubActive = (s) => {
          if (!s) return false;
          const st = (s.status || "").toLowerCase();
          const valid = st === "active" || st === "trial" || s.is_trial === true;
          if (!valid) return false;
          if (!s.expires_at) return true;
          const exp = new Date(s.expires_at).getTime();
          return !isNaN(exp) && exp > Date.now();
        };
        if (res.user?.is_admin || res.user?.email?.toLowerCase() === "contact@officialdukaan.in") {
          nav("/admin");
          return;
        }
        const hasSub = Boolean(isSubActive(sub));
        if (onSuccess) onSuccess(res.user);
        else nav(hasSub ? "/app" : "/subscribe");
      } else {
        toast.error(res.error || "Failed to sign in with Apple.");
      }
    } catch (err) {
      toast.error("Authentication with Apple failed.");
    } finally {
      setBusyProvider(null);
    }
  };

  return (
    <>
      <div className="space-y-2.5 w-full">
        {/* =========================================================
            BIG TECH STANDARD: REAL GOOGLE OAUTH 2.0 API BUTTON
        ========================================================= */}
        <button
          type="button"
          onClick={handleGoogleClick}
          disabled={busyProvider !== null}
          className="w-full h-11 px-4 rounded-xl bg-white hover:bg-slate-50 active:bg-slate-100 border border-[#dadce0] hover:border-[#c4c7c5] text-[#3c4043] font-medium text-sm shadow-xs hover:shadow-sm transition-all duration-150 flex items-center justify-center gap-3 relative cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed select-none"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            className="shrink-0"
            style={{ width: "18px", height: "18px", minWidth: "18px", minHeight: "18px", display: "inline-block" }}
            aria-hidden="true"
          >
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span className="tracking-normal font-medium text-sm text-[#3c4043]">
            {busyProvider === "google"
              ? "Connecting to Google..."
              : mode === "register"
              ? "Sign up with Google"
              : "Sign in with Google"}
          </span>
        </button>

        {/* =========================================================
            BIG TECH STANDARD: SIGN IN WITH APPLE
        ========================================================= */}
        <button
          type="button"
          onClick={handleAppleClick}
          disabled={busyProvider !== null}
          className="w-full h-11 px-4 rounded-xl bg-black hover:bg-[#1a1a1a] active:bg-[#262626] border border-black text-white font-medium text-sm shadow-xs hover:shadow-sm transition-all duration-150 flex items-center justify-center gap-3 relative cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed select-none"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 170 170"
            fill="currentColor"
            className="shrink-0 text-white"
            style={{ width: "16px", height: "16px", minWidth: "16px", minHeight: "16px", display: "inline-block" }}
            aria-hidden="true"
          >
            <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.7-3.04-7.7-7.83-12.01-14.38-6.19-9.46-11.1-20.2-14.73-32.22-3.63-12.03-5.45-23.36-5.45-34 0-14.46 3.65-26.4 10.96-35.83 7.31-9.43 16.36-14.28 27.15-14.56 5.12 0 10.86 1.34 17.21 4.02 6.36 2.69 10.36 4.09 12 4.21 1.91-.12 6.13-1.57 12.65-4.35 6.53-2.77 12.08-4.04 16.66-3.8 12.5.65 22.45 4.96 29.83 12.92-10.89 6.64-16.22 15.77-16 27.4.22 9.03 3.59 16.71 10.11 23.03 6.53 6.32 14.33 9.94 23.41 10.86-2.17 6.43-4.78 12.87-7.83 19.33zM119.22 31.84c0-7.39 2.65-14.28 7.94-20.69 5.29-6.41 11.96-10.46 20-12.15.22 1.3.33 2.49.33 3.59 0 7.39-2.74 14.27-8.23 20.64-5.49 6.36-12.18 10.42-20.04 12.17-.11-.98-.17-2.18-.17-3.56z" />
          </svg>
          <span className="tracking-normal font-medium text-sm text-white">
            {busyProvider === "apple"
              ? "Connecting..."
              : mode === "register"
              ? "Sign up with Apple"
              : "Sign in with Apple"}
          </span>
        </button>
      </div>

      {/* =========================================================
          AUTHENTIC APPLE ID SIGN-IN SHEET
      ========================================================= */}
      <Dialog open={showApplePrompt} onOpenChange={setShowApplePrompt}>
        <DialogContent className="max-w-sm rounded-3xl bg-white p-6 border border-slate-200 shadow-2xl text-center font-sans">
          <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 text-black grid place-items-center mb-3">
            <svg width="22" height="22" viewBox="0 0 170 170" fill="currentColor" className="shrink-0 text-black">
              <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.7-3.04-7.7-7.83-12.01-14.38-6.19-9.46-11.1-20.2-14.73-32.22-3.63-12.03-5.45-23.36-5.45-34 0-14.46 3.65-26.4 10.96-35.83 7.31-9.43 16.36-14.28 27.15-14.56 5.12 0 10.86 1.34 17.21 4.02 6.36 2.69 10.36 4.09 12 4.21 1.91-.12 6.13-1.57 12.65-4.35 6.53-2.77 12.08-4.04 16.66-3.8 12.5.65 22.45 4.96 29.83 12.92-10.89 6.64-16.22 15.77-16 27.4.22 9.03 3.59 16.71 10.11 23.03 6.53 6.32 14.33 9.94 23.41 10.86-2.17 6.43-4.78 12.87-7.83 19.33zM119.22 31.84c0-7.39 2.65-14.28 7.94-20.69 5.29-6.41 11.96-10.46 20-12.15.22 1.3.33 2.49.33 3.59 0 7.39-2.74 14.27-8.23 20.64-5.49 6.36-12.18 10.42-20.04 12.17-.11-.98-.17-2.18-.17-3.56z" />
            </svg>
          </div>

          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Sign in with Apple ID</h2>
          <p className="text-xs text-slate-500 mt-1 mb-5">
            Use your Apple ID to sign in to Kivo. Instant verified access.
          </p>

          <form onSubmit={submitAppleAuth} className="space-y-3.5 text-left">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Apple ID / iCloud Email</label>
              <Input
                type="email"
                required
                autoFocus
                value={appleEmail}
                onChange={(e) => setAppleEmail(e.target.value)}
                placeholder="owner@icloud.com"
                className="h-11 rounded-xl border border-slate-300 text-xs text-slate-900"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Your Name (Optional)</label>
              <Input
                type="text"
                value={appleName}
                onChange={(e) => setAppleName(e.target.value)}
                placeholder="Shop Owner"
                className="h-11 rounded-xl border border-slate-300 text-xs text-slate-900"
              />
            </div>

            <Button
              type="submit"
              disabled={busyProvider !== null}
              className="w-full h-11 rounded-xl bg-black hover:bg-[#1a1a1a] text-white font-medium text-xs mt-3 shadow-xs"
            >
              {busyProvider !== null ? "Signing in..." : "Continue with Apple ID"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
