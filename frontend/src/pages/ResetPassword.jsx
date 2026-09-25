import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { api, formatApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ShieldCheck, Lock, Eye, EyeOff, KeyRound, ArrowRight, CheckCircle2, AlertCircle, Mail } from "lucide-react";
import Card3D from "@/components/Card3D";
import ThreeDBackground from "@/components/ThreeDBackground";

export default function ResetPassword() {
  const [params] = useSearchParams();
  const nav = useNavigate();
  const token = params.get("token") || "";
  const initialEmail = params.get("email") || "";

  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const hasMinLength = pw.length >= 8;
  const hasUpper = /[A-Z]/.test(pw);
  const hasNumber = /[0-9]/.test(pw);
  const hasSymbol = /[!@#$%^&*(),.?":{}|<>\-_+=\[\]\\/`~]/.test(pw);
  const isPasswordValid = hasMinLength && hasUpper && hasNumber && hasSymbol;

  const submit = async (e) => {
    e.preventDefault();
    if (!token && (!email.trim() || !code.trim())) {
      return setErr("Please provide your email and the 6-digit reset code.");
    }
    if (!isPasswordValid) {
      return setErr("Password must meet all 4 security requirements below.");
    }
    if (pw !== pw2) {
      return setErr("Passwords do not match.");
    }

    setBusy(true);
    setErr("");
    try {
      if (token) {
        await api.post("/auth/reset-password", { token, new_password: pw });
      } else {
        await api.post("/auth/reset-password", { email: email.trim().toLowerCase(), code: code.trim(), new_password: pw });
      }
      toast.success("Password reset successfully! You can now log in.");
      nav("/login");
    } catch (e) {
      setErr(formatApiError(e.response?.data?.detail) || "Invalid or expired reset code. Please request a new one.");
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
      <main className="relative z-20 max-w-md mx-auto w-full px-6 py-6 my-auto animate-fade-up">
        <Card3D depth={12}>
          <div className="bg-white p-8 sm:p-10 rounded-3xl border border-slate-200 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-sky-500 to-indigo-600" />

            <div className="mb-6">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-[10px] font-bold text-blue-700 mb-2">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                <span>Password Reset</span>
              </div>
              <h1 className="font-display text-2xl font-bold text-slate-900">
                Set New Password
              </h1>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Enter your security details and choose a strong new password.
              </p>
            </div>

            {err && (
              <div className="mb-4 p-3.5 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-700 font-semibold flex items-center gap-2 animate-shake">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                <span>{err}</span>
              </div>
            )}

            <form onSubmit={submit} className="space-y-4" data-testid="reset-form">
              
              {!token && (
                <>
                  <div className="space-y-1.5 text-left">
                    <Label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Registered Email
                    </Label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      <Input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="owner@yourkivo.com"
                        className="pl-11 pr-4 h-11 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 text-sm focus:border-blue-600 focus:bg-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5 text-left">
                    <Label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      6-Digit Reset Code
                    </Label>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      <Input
                        type="text"
                        maxLength={6}
                        required
                        value={code}
                        onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                        placeholder="123456"
                        className="pl-11 pr-4 h-11 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 text-sm font-mono tracking-widest font-bold focus:border-blue-600 focus:bg-white"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* New Password */}
              <div className="space-y-1.5 text-left">
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  New Password
                </Label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input 
                    data-testid="reset-pw" 
                    type={showPw ? "text" : "password"} 
                    value={pw} 
                    onChange={(e) => setPw(e.target.value)} 
                    placeholder="••••••••"
                    required 
                    className="pl-11 pr-11 h-12 rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 text-sm font-mono focus:border-blue-600 focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                  >
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password Rules Checklist */}
                <div className="pt-2 p-3 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1.5 text-[11px]">
                  <div className="font-bold text-slate-600 text-[10px] uppercase tracking-wider mb-1">
                    Requirements:
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <div className={`flex items-center gap-1.5 font-medium ${hasMinLength ? "text-emerald-700 font-bold" : "text-slate-400"}`}>
                      <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 ${hasMinLength ? "text-emerald-600" : "text-slate-300"}`} />
                      <span>8+ Characters</span>
                    </div>
                    <div className={`flex items-center gap-1.5 font-medium ${hasUpper ? "text-emerald-700 font-bold" : "text-slate-400"}`}>
                      <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 ${hasUpper ? "text-emerald-600" : "text-slate-300"}`} />
                      <span>1 Capital Letter</span>
                    </div>
                    <div className={`flex items-center gap-1.5 font-medium ${hasNumber ? "text-emerald-700 font-bold" : "text-slate-400"}`}>
                      <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 ${hasNumber ? "text-emerald-600" : "text-slate-300"}`} />
                      <span>1 Number</span>
                    </div>
                    <div className={`flex items-center gap-1.5 font-medium ${hasSymbol ? "text-emerald-700 font-bold" : "text-slate-400"}`}>
                      <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 ${hasSymbol ? "text-emerald-600" : "text-slate-300"}`} />
                      <span>1 Symbol (!@#$)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5 text-left">
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Confirm Password
                </Label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input 
                    data-testid="reset-pw2" 
                    type={showPw ? "text" : "password"} 
                    value={pw2} 
                    onChange={(e) => setPw2(e.target.value)} 
                    placeholder="••••••••"
                    required 
                    className="pl-11 pr-4 h-12 rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 text-sm font-mono focus:border-blue-600 focus:bg-white"
                  />
                </div>
              </div>

              <Button 
                data-testid="reset-submit" 
                disabled={busy || !isPasswordValid || pw !== pw2} 
                className="w-full h-12 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs shadow-lg shadow-blue-600/25 active:scale-95 transition-all mt-3 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <span>{busy ? "Saving New Password..." : "Update Password & Log In"}</span>
                <ArrowRight className="w-4 h-4" />
              </Button>

            </form>
          </div>
        </Card3D>
      </main>

      <footer className="relative z-20 max-w-7xl mx-auto w-full px-6 py-4 text-center text-xs text-slate-400">
        © 2026 Kivo · Business Made Simple · All rights reserved.
      </footer>
    </div>
  );
}
