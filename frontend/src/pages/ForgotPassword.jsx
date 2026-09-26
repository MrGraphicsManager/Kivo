import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, formatApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, ArrowLeft, Mail, ArrowRight, ShieldCheck } from "lucide-react";
import Card3D from "@/components/Card3D";
import ThreeDBackground from "@/components/ThreeDBackground";

export default function ForgotPassword() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) return setErr("Please enter your registered email address.");
    setBusy(true); 
    setErr("");
    
    // Never create or persist password-reset secrets in browser storage.
    // Reset codes/tokens are generated and validated by the server.
    try {
      await api.post("/auth/forgot-password", { email: cleanEmail });
      setSent(true);
    } catch (e) {
      if (e.response?.status === 404) {
        setErr("No registered account found with this email. Please check the spelling or create an account.");
      } else {
        // Show sent confirmation for user privacy / offline support
        setSent(true);
      }
    } finally { 
      setBusy(false); 
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#F8FAFC] text-slate-900 font-sans selection:bg-blue-600/20 selection:text-blue-700 flex flex-col justify-between">
      {/* Ambient glowing blooms */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[450px] bg-gradient-to-b from-blue-400/10 via-indigo-400/5 to-transparent blur-[120px] rounded-full" />
        <div className="absolute top-[40%] right-[-10%] w-[500px] h-[500px] bg-sky-400/10 blur-[140px] rounded-full" />
      </div>

      {/* Header */}
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
        <Link 
          to="/login" 
          className="text-xs font-bold px-4 py-2 rounded-full border border-slate-300 text-slate-700 hover:border-blue-600 hover:text-blue-600 bg-white hover:bg-slate-50 shadow-xs active:scale-95 transition-all"
        >
          Back to Login
        </Link>
      </header>

      {/* Main Card */}
      <main className="relative z-20 max-w-md mx-auto w-full px-6 py-6 my-auto">
        <Card3D depth={12}>
          <div className="bg-white p-8 sm:p-10 rounded-3xl border border-slate-200 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-sky-500 to-indigo-600" />

            {sent ? (
              <div className="text-center py-4 space-y-4" data-testid="forgot-sent">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 grid place-items-center shadow-xs">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h1 className="font-display text-2xl font-bold text-slate-900">
                  Check Your Email
                </h1>
                <p className="text-xs text-slate-600 leading-relaxed">
                  If an account exists for <b className="text-slate-900">{email}</b>, we have dispatched a password reset link and 6-digit code.
                </p>
                <div className="pt-3 space-y-2">
                  <Button
                    onClick={() => nav(`/reset-password?email=${encodeURIComponent(email)}`)}
                    className="w-full h-11 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs shadow-lg shadow-blue-600/25 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Enter Code to Set New Password</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                  <Link 
                    to="/login" 
                    className="inline-block text-xs text-slate-500 hover:text-blue-600 font-semibold pt-1"
                  >
                    ← Back to Login
                  </Link>
                </div>
              </div>
            ) : (
              <div>
                <div className="mb-6">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-[10px] font-bold text-blue-700 mb-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                    <span>Account Recovery</span>
                  </div>
                  <h1 className="font-display text-2xl font-bold text-slate-900">
                    Forgot Password?
                  </h1>
                  <p className="text-xs text-slate-500 font-medium mt-1">
                    Enter your registered shop email and we'll send you a password reset code.
                  </p>
                </div>

                {err && (
                  <div className="mb-4 p-3 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-700 font-semibold">
                    {err}
                  </div>
                )}

                <form onSubmit={submit} className="space-y-4" data-testid="forgot-form">
                  <div className="space-y-1.5 text-left">
                    <Label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Email Address
                    </Label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      <Input 
                        data-testid="forgot-email" 
                        type="email" 
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)} 
                        placeholder="owner@yourkivo.com"
                        required 
                        className="pl-11 pr-4 h-12 rounded-2xl border border-slate-200 focus-visible:border-blue-600 focus-visible:bg-white bg-slate-50 text-sm font-medium text-slate-900 placeholder:text-slate-400"
                      />
                    </div>
                  </div>

                  <Button 
                    data-testid="forgot-submit" 
                    disabled={busy} 
                    className="w-full h-12 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs shadow-lg shadow-blue-600/25 active:scale-95 transition-all mt-2 cursor-pointer"
                  >
                    {busy ? "Sending Instructions..." : "Send Reset Link & Code"}
                  </Button>

                  <div className="pt-4 text-center text-xs text-slate-500">
                    Remembered your password?{" "}
                    <Link to="/login" className="text-blue-600 font-bold hover:underline">
                      Sign in
                    </Link>
                  </div>
                </form>
              </div>
            )}

          </div>
        </Card3D>
      </main>

      <footer className="relative z-20 max-w-7xl mx-auto w-full px-6 py-4 text-center text-xs text-slate-400">
        Kivo Retail OS · Business Made Simple · © 2026
      </footer>
    </div>
  );
}
