import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { 
  Zap, 
  Store, 
  Mail, 
  Lock, 
  UserRound, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  CheckCircle2, 
  Sparkles, 
  ShieldCheck, 
  BadgePercent,
  Receipt,
  MessageSquare
} from "lucide-react";
import Card3D from "@/components/Card3D";
import ThreeDBackground from "@/components/ThreeDBackground";
import SocialAuthButtons from "@/components/SocialAuthButtons";

export default function Register() {
  const { register, login } = useAuth();
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const hasMinLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSymbol = /[!@#$%^&*(),.?":{}|<>\-_+=\[\]\\/`~]/.test(password);
  const isPasswordValid = hasMinLength && hasUpper && hasNumber && hasSymbol;

  const submit = async (e) => {
    e.preventDefault();
    setErr(""); 

    if (!isPasswordValid) {
      setErr("Password must be at least 8 characters and include a capital letter, a number, and a symbol.");
      toast.error("Please satisfy all password security requirements.");
      return;
    }

    setBusy(true);
    const res = await register(name, email, password, referralCode);
    setBusy(false);
    if (res.ok) {
      toast.success("Account created! Please check your email for the verification code.");
      nav(`/verify-email?email=${encodeURIComponent(email)}`);
    } else {
      setErr(res.error || "Failed to create account. Please try again.");
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#F8FAFC] text-slate-900 font-sans selection:bg-blue-600/20 selection:text-blue-700 flex flex-col justify-between">
      
      {/* Ambient glowing blooms */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[450px] bg-gradient-to-b from-blue-400/10 via-indigo-400/5 to-transparent blur-[120px] rounded-full" />
        <div className="absolute top-[40%] right-[-10%] w-[500px] h-[500px] bg-sky-400/10 blur-[140px] rounded-full" />
        <div className="absolute bottom-10 left-[-10%] w-[500px] h-[500px] bg-indigo-400/10 blur-[140px] rounded-full" />
      </div>

      {/* Top Brand Navbar */}
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
          <span className="text-xs font-semibold text-slate-500 hidden sm:inline">Already registered?</span>
          <Link 
            to="/login" 
            className="text-xs font-bold px-4 py-2 rounded-full border border-slate-300 text-slate-700 hover:border-blue-600 hover:text-blue-600 bg-white hover:bg-slate-50 shadow-xs active:scale-95 transition-all"
          >
            Sign In
          </Link>
        </div>
      </header>

      {/* Main Dual-Pane Stage */}
      <main className="relative z-20 max-w-7xl mx-auto w-full px-6 py-4 my-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">

          {/* LEFT COLUMN: LIGHT REGISTER FORM */}
          <div className="lg:col-span-6 w-full max-w-md mx-auto">
            
            <Card3D depth={12}>
              <div className="bg-white p-8 sm:p-10 rounded-3xl border border-slate-200 shadow-2xl relative overflow-hidden">
                
                {/* Top Glowing Gradient Bar */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-sky-500 to-indigo-600" />

                {/* Form Header with Official Logo */}
                <div className="text-center mb-6">
                  <Link to="/" className="inline-block mb-3 transition-transform hover:scale-105">
                    <div className="flex items-center px-1.5 py-0.5 rounded-xl">
                      <img 
                        src="/kivo-logo.png" 
                        alt="Kivo" 
                        className="h-8 sm:h-9 w-auto object-contain" 
                      />
                    </div>
                  </Link>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-[11px] font-bold text-blue-700 mb-2">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    <span>Free Merchant Account</span>
                  </div>
                  <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                    Open Your Shop
                  </h2>
                  <p className="text-xs text-slate-500 font-medium mt-1">
                    Create your merchant account to get started with Kivo Retail OS.
                  </p>
                </div>

                {/* 1-Click Social Sign In (Google & Apple) */}
                <div className="mb-5">
                  <SocialAuthButtons mode="register" />
                </div>

                {/* Divider */}
                <div className="relative my-5">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-3 text-slate-400 font-semibold font-mono tracking-wider">
                      Or register with email
                    </span>
                  </div>
                </div>

                {/* Error Banner */}
                {err && (
                  <div className="mb-5 p-3.5 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-700 font-semibold space-y-1.5 text-left">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                      <span>{err}</span>
                    </div>
                  </div>
                )}

                {/* Register Form */}
                <form onSubmit={submit} className="space-y-4">
                  
                  {/* Shop / Owner Name */}
                  <div className="space-y-1.5 text-left">
                    <Label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Owner or Shop Name
                    </Label>
                    <div className="relative">
                      <Store className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      <Input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Sharma General Store"
                        className="pl-11 pr-4 h-12 rounded-2xl border border-slate-200 focus-visible:border-blue-600 focus-visible:bg-white bg-slate-50 text-sm font-medium text-slate-900 placeholder:text-slate-400"
                      />
                    </div>
                  </div>

                  {/* Email Field */}
                  <div className="space-y-1.5 text-left">
                    <Label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Shop Email
                    </Label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      <Input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="owner@yourkivo.com"
                        className="pl-11 pr-4 h-12 rounded-2xl border border-slate-200 focus-visible:border-blue-600 focus-visible:bg-white bg-slate-50 text-sm font-medium text-slate-900 placeholder:text-slate-400"
                      />
                    </div>
                  </div>

                  {/* Password Field */}
                  <div className="space-y-1.5 text-left">
                    <Label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Password
                    </Label>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      <Input
                        type={showPassword ? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="At least 8 chars"
                        className="pl-11 pr-11 h-12 rounded-2xl border border-slate-200 focus-visible:border-blue-600 focus-visible:bg-white bg-slate-50 text-sm font-medium text-slate-900 placeholder:text-slate-400 font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Password Requirements Badges */}
                    {password && (
                      <div className="grid grid-cols-2 gap-1.5 pt-1.5 text-[11px]">
                        <span className={`flex items-center gap-1 ${hasMinLength ? "text-emerald-700" : "text-slate-400"}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${hasMinLength ? "bg-emerald-500" : "bg-slate-300"}`} />
                          8+ Characters
                        </span>
                        <span className={`flex items-center gap-1 ${hasUpper ? "text-emerald-700" : "text-slate-400"}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${hasUpper ? "bg-emerald-500" : "bg-slate-300"}`} />
                          Uppercase Letter
                        </span>
                        <span className={`flex items-center gap-1 ${hasNumber ? "text-emerald-700" : "text-slate-400"}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${hasNumber ? "bg-emerald-500" : "bg-slate-300"}`} />
                          Number
                        </span>
                        <span className={`flex items-center gap-1 ${hasSymbol ? "text-emerald-700" : "text-slate-400"}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${hasSymbol ? "bg-emerald-500" : "bg-slate-300"}`} />
                          Symbol
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Referral Code (Optional) */}
                  <div className="space-y-1.5 text-left">
                    <Label htmlFor="referral" className="text-xs font-bold text-slate-700 flex items-center justify-between">
                      <span>Partner Referral Code</span>
                      <span className="text-[10px] text-slate-400 font-normal">Optional</span>
                    </Label>
                    <div className="relative">
                      <BadgePercent className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input
                        id="referral"
                        type="text"
                        value={referralCode}
                        onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                        placeholder="e.g. PARTNER50"
                        className="pl-11 h-11 rounded-2xl border border-slate-200 focus-visible:border-blue-600 focus-visible:bg-white bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-900 placeholder:normal-case placeholder:font-normal placeholder:text-slate-400"
                      />
                    </div>
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    disabled={busy || !isPasswordValid}
                    className="w-full h-12 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm shadow-lg shadow-blue-600/25 active:scale-95 transition-all flex items-center justify-center gap-2 mt-4 cursor-pointer disabled:opacity-50"
                  >
                    <span>{busy ? "Registering Shop..." : "Create Account & Verify Email"}</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>

                </form>

                {/* Login Footer */}
                <div className="pt-6 mt-6 border-t border-slate-200 text-center text-xs font-semibold text-slate-500">
                  <span>Already have an account? </span>
                  <Link to="/login" className="text-blue-600 font-bold hover:text-blue-700 hover:underline">
                    Sign in to your shop
                  </Link>
                </div>

                {/* Ecosystem Footnote */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[11px] text-slate-400 font-medium">
                  <span>Part of the</span>
                  <span className="font-bold text-slate-600">Kivo</span>
                  <span>Ecosystem</span>
                </div>

              </div>
            </Card3D>

          </div>

          {/* RIGHT COLUMN: HIGHLIGHTS SHOWCASE (DESKTOP) */}
          <div className="hidden lg:flex lg:col-span-6 flex-col justify-center space-y-8">
            
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span className="text-xs font-bold text-blue-700 uppercase tracking-wider font-mono">
                  Everything from Day 1
                </span>
              </div>
              <h1 className="font-display text-5xl xl:text-6xl font-extrabold text-slate-900 leading-[1.1] tracking-tight">
                Modern billing for your<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600">
                  Kirana & Retail store.
                </span>
              </h1>
              <p className="text-base text-slate-600 max-w-lg font-medium leading-relaxed">
                Join thousands of Indian small business owners managing sales, customer ledgers, and inventory effortlessly on any device.
              </p>
            </div>

            {/* Features Showcase Card */}
            <Card3D depth={16} className="w-full max-w-md">
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xl space-y-4">
                
                <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 grid place-items-center shrink-0">
                    <Receipt className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-sm text-slate-900">0.8-Sec POS Thermal Invoicing</div>
                    <div className="text-xs text-slate-500">F1-F6 shortcuts with instant print & WhatsApp slip</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 grid place-items-center shrink-0">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-sm text-slate-900">1-Tap WhatsApp Udhaar Reminders</div>
                    <div className="text-xs text-slate-500">Recover pending khata automatically with zero awkwardness</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200 grid place-items-center shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-sm text-slate-900">100% Secure Encrypted Khata</div>
                    <div className="text-xs text-slate-500">Your customer data and accounts stay safe and private</div>
                  </div>
                </div>

              </div>
            </Card3D>

            {/* Trust Badges */}
            <div className="flex items-center gap-6 text-xs font-medium text-slate-500 pt-2">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Zero Installation Needed</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
                <span>Phone, Tablet & Laptop Friendly</span>
              </div>
            </div>

          </div>

        </div>
      </main>

      {/* Bottom Footer Note */}
      <footer className="relative z-20 py-4 text-center text-xs text-slate-400 font-medium">
        Kivo Retail OS · Business Made Simple · © 2026
      </footer>

    </div>
  );
}
