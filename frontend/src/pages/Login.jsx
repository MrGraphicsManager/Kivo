import React, { useState, useCallback, useMemo } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { 
  Zap, 
  Store, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  Receipt, 
  ShieldCheck, 
  ArrowRight, 
  CheckCircle2, 
  Sparkles,
  Volume2,
  TrendingUp,
  AlertOctagon
} from "lucide-react";
import Card3D from "@/components/Card3D";
import ThreeDBackground from "@/components/ThreeDBackground";
import OnboardingLoader from "@/components/OnboardingLoader";
import SocialAuthButtons from "@/components/SocialAuthButtons";

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const isEmergencyLockdown = useMemo(() => {
    return new URLSearchParams(loc.search).get("emergency_lockdown") === "1";
  }, [loc.search]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [needVerify, setNeedVerify] = useState(false);
  const [showLoader, setShowLoader] = useState(false);

  const handleLoaderComplete = useCallback(() => {
    let currentUser = null;
    try {
      currentUser = JSON.parse(localStorage.getItem("dukaan_user") || "{}");
    } catch {}
    const isSubActive = (sub) => {
      if (!sub) return false;
      const st = (sub.status || "").toLowerCase();
      const valid = st === "active" || st === "trial" || sub.is_trial === true;
      if (!valid) return false;
      if (!sub.expires_at) return true;
      const exp = new Date(sub.expires_at).getTime();
      return !isNaN(exp) && exp > Date.now();
    };
    if (currentUser?.is_admin || currentUser?.email?.toLowerCase() === "contact@officialdukaan.in") {
      nav("/admin");
      return;
    }
    if (currentUser?.is_verified === false || currentUser?.email_verified === false) {
      nav(`/verify-email?email=${encodeURIComponent(currentUser?.email || "")}`);
      return;
    }
    if (!currentUser?.phone_verified) {
      nav(`/verify-phone?email=${encodeURIComponent(currentUser?.email || "")}`);
      return;
    }
    const hasActiveSub = Boolean(isSubActive(currentUser?.subscription));
    if (!hasActiveSub) {
      nav("/subscribe");
    } else {
      nav("/app");
    }
  }, [nav]);

  const submit = async (e) => {
    e.preventDefault();
    setErr(""); 
    setNeedVerify(false);
    setBusy(true);
    const res = await login(email, password);
    setBusy(false);
    if (res.ok) {
      if (rememberMe) {
        localStorage.setItem("dukaan_remember", "true");
      } else {
        localStorage.removeItem("dukaan_remember");
      }
      // Remove any lingering maintenance/lockdown blocks in localStorage
      localStorage.removeItem("dukaan_platform_maintenance");
      toast.success("Welcome back to Kivo!");
      setShowLoader(true);
    } else {
      if (res.needVerification || res.step === "email") {
        setNeedVerify(true);
        setErr(res.error || "Please verify your email address to continue.");
        toast.info("A 6-digit verification code has been dispatched to your email.");
        setTimeout(() => {
          nav(`/verify-email?email=${encodeURIComponent(email)}`);
        }, 1200);
      } else if (res.needPhoneVerification || res.step === "phone") {
        toast.info("Please verify your mobile number to continue.");
        setTimeout(() => {
          nav(`/verify-phone?email=${encodeURIComponent(email)}`);
        }, 1200);
      } else {
        setErr(res.error || "Invalid email or password. Please try again.");
      }
    }
  };

  if (showLoader) {
    return <OnboardingLoader onComplete={handleLoaderComplete} />;
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#F8FAFC] text-slate-900 font-sans selection:bg-blue-600/20 selection:text-blue-700 flex flex-col justify-between">
      
      {/* Ambient glowing radial blooms */}
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
          <span className="text-xs font-semibold text-slate-500 hidden sm:inline">New to Kivo?</span>
          <Link 
            to="/register" 
            className="text-xs font-bold px-4 py-2 rounded-full border border-slate-300 text-slate-700 hover:border-blue-600 hover:text-blue-600 bg-white hover:bg-slate-50 shadow-xs active:scale-95 transition-all"
          >
            Create Account
          </Link>
        </div>
      </header>

      {/* Main Dual-Pane Stage */}
      <main className="relative z-20 max-w-7xl mx-auto w-full px-6 py-4 my-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">

          {/* LEFT COLUMN: 3D INTERACTIVE SHOWCASE (DESKTOP) */}
          <div className="hidden lg:flex lg:col-span-6 flex-col justify-center space-y-8">
            
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span className="text-xs font-bold text-blue-700 uppercase tracking-wider font-mono">
                  Retail Command Center
                </span>
              </div>
              <h1 className="font-display text-5xl xl:text-6xl font-extrabold text-slate-900 leading-[1.1] tracking-tight">
                Run your shop.<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600">
                  Smarter & Faster.
                </span>
              </h1>
              <p className="text-base text-slate-600 max-w-lg font-medium leading-relaxed">
                Log in to access high-speed POS billing, digital customer khata, WhatsApp payment reminders, and multi-year tax reports.
              </p>
            </div>

            {/* 3D Floating Showcase Card */}
            <div className="relative pt-4 pb-8">
              
              <Card3D depth={18} className="w-full max-w-md">
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xl relative overflow-hidden">
                  
                  {/* Decorative ambient line */}
                  <div className="absolute inset-0 bg-[radial-gradient(#3B82F6_1px,transparent_1px)] [background-size:16px_16px] opacity-10 pointer-events-none" />
                  
                  {/* Terminal Header */}
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                      <span className="text-xs font-bold text-slate-800 font-mono uppercase tracking-wider">
                        COUNTER 01 · LIVE
                      </span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                      0.8s POS Billing
                    </span>
                  </div>

                  {/* Bill Simulation Preview */}
                  <div className="mt-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-medium text-slate-500">Walk-in Customer Memo</span>
                      <span className="font-mono font-bold text-slate-800">#KV-8821</span>
                    </div>
                    <div className="flex justify-between items-baseline">
                      <span className="text-xs font-semibold text-slate-500">Total Collected</span>
                      <span className="font-display font-extrabold text-2xl text-emerald-600">₹450.00</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 pt-1 border-t border-slate-200/60">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Paid via UPI · WhatsApp Receipt Sent
                    </div>
                  </div>

                  {/* 3 Live Mini Stats */}
                  <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                      <div className="text-[10px] uppercase font-bold text-slate-500">Speed</div>
                      <div className="font-mono font-bold text-slate-900 text-xs mt-0.5">0.8s / Bill</div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                      <div className="text-[10px] uppercase font-bold text-emerald-700">Recovery</div>
                      <div className="font-mono font-bold text-emerald-700 text-xs mt-0.5">92% Khata</div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                      <div className="text-[10px] uppercase font-bold text-blue-700">Stock</div>
                      <div className="font-mono font-bold text-blue-700 text-xs mt-0.5">Live Sync</div>
                    </div>
                  </div>

                </div>
              </Card3D>

              {/* Floating Hologram Soundbox Pill */}
              <div className="absolute -bottom-4 right-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2.5 rounded-2xl shadow-xl border border-blue-400/30 flex items-center gap-2.5">
                <Volume2 className="w-4 h-4 text-amber-300" />
                <span className="text-xs font-mono font-bold">Soundbox: ₹450 Prapt Hue!</span>
              </div>

            </div>

            {/* Security Guarantee */}
            <div className="flex items-center gap-6 text-xs font-medium text-slate-500 pt-2">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>256-Bit Encrypted Khata</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
                <span>GST & Thermal Ready</span>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: LIGHT GLASS LOGIN FORM */}
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
                    <span>Retail OS · Owner Portal</span>
                  </div>
                  <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                    Welcome Back
                  </h2>
                  <p className="text-xs text-slate-500 font-medium mt-1">
                    Sign in to open your shop counter and billing register.
                  </p>
                </div>

                {/* Emergency Session Reset Notice */}
                {isEmergencyLockdown && (
                  <div className="mb-4 p-3 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-2.5 text-left text-xs text-amber-800">
                    <AlertOctagon className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Platform Security Refresh:</span>
                      <p className="text-[11px] text-amber-700 mt-0.5 leading-relaxed">
                        An administrative reset occurred. Sign in with your password to reconnect your store.
                      </p>
                    </div>
                  </div>
                )}

                {/* 1-Click Social Sign In (Google & Apple) */}
                <div className="mb-5">
                  <SocialAuthButtons mode="login" />
                </div>

                {/* Divider */}
                <div className="relative my-5">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-3 text-slate-400 font-semibold font-mono tracking-wider">
                      Or continue with email
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
                    {needVerify && (
                      <div className="pt-1 pl-4">
                        <Link 
                          to={`/verify-email?email=${encodeURIComponent(email)}`} 
                          className="text-xs font-bold text-blue-600 underline hover:text-blue-700 block"
                        >
                          Click here to enter your verification code →
                        </Link>
                      </div>
                    )}
                    {err.toLowerCase().includes("no account found") && (
                      <div className="pt-1 pl-4">
                        <Link 
                          to="/register" 
                          className="text-xs font-bold text-blue-600 underline hover:text-blue-700 block"
                        >
                          Create a new account now →
                        </Link>
                      </div>
                    )}
                  </div>
                )}

                {/* Login Form */}
                <form onSubmit={submit} className="space-y-4">
                  
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
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                        Password
                      </Label>
                      <Link 
                        to="/forgot-password" 
                        className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline"
                      >
                        Forgot?
                      </Link>
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      <Input
                        type={showPassword ? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
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
                  </div>

                  {/* Remember Me Toggle */}
                  <div className="flex items-center gap-2 pt-1 text-left">
                    <Checkbox
                      id="remember"
                      checked={rememberMe}
                      onCheckedChange={(checked) => setRememberMe(!!checked)}
                      className="border border-slate-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 rounded-md"
                    />
                    <Label htmlFor="remember" className="text-xs font-medium text-slate-600 cursor-pointer select-none">
                      Keep me logged in on this device
                    </Label>
                  </div>

                  {/* Main Submit Button */}
                  <Button
                    type="submit"
                    disabled={busy}
                    className="w-full h-12 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm shadow-lg shadow-blue-600/25 active:scale-95 transition-all flex items-center justify-center gap-2 mt-3 cursor-pointer"
                  >
                    <span>{busy ? "Authenticating..." : "Log in to Kivo"}</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>

                </form>

                {/* Register Footer */}
                <div className="pt-6 mt-6 border-t border-slate-200 text-center text-xs font-semibold text-slate-500">
                  <span>Don't have a shop account? </span>
                  <Link to="/register" className="text-blue-600 font-bold hover:text-blue-700 hover:underline">
                    Create your free shop
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

        </div>
      </main>

      {/* Bottom Footer Note */}
      <footer className="relative z-20 py-4 text-center text-xs text-slate-400 font-medium">
        Kivo Retail OS · Business Made Simple · © 2026
      </footer>

    </div>
  );
}
