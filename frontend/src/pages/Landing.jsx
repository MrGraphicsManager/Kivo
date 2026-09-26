import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Zap, 
  ArrowRight, 
  Check, 
  Sparkles, 
  MessageCircle, 
  Printer, 
  ShieldCheck, 
  Store, 
  TrendingUp, 
  CreditCard, 
  Keyboard, 
  Smartphone, 
  ChevronRight, 
  Star 
} from "lucide-react";
import { useAuth } from "@/lib/AuthContext";

export default function Landing() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [billingCycle, setBillingCycle] = useState("monthly"); // "monthly" | "annual"

  const scrollToPricing = () => {
    document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans selection:bg-blue-600/20 selection:text-blue-700 relative overflow-x-hidden">
      {/* Ambient background glows */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[450px] bg-gradient-to-b from-blue-400/10 via-indigo-400/5 to-transparent blur-[120px] rounded-full" />
        <div className="absolute top-[40%] right-[-10%] w-[500px] h-[500px] bg-sky-400/10 blur-[140px] rounded-full" />
        <div className="absolute bottom-10 left-[-10%] w-[500px] h-[500px] bg-indigo-400/10 blur-[140px] rounded-full" />
      </div>

      {/* 1. Sleek Floating Header */}
      <header className="sticky top-4 z-50 max-w-5xl mx-auto px-4">
        <nav className="bg-white/85 backdrop-blur-xl border border-slate-200/80 rounded-full px-5 py-3 flex items-center justify-between shadow-lg shadow-slate-200/40">
          {/* Official Kivo Brand Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="flex items-center px-1.5 py-0.5 rounded-xl group-hover:scale-105 transition-transform">
              <img src="/kivo-logo.png" alt="Kivo - Business Made Simple" className="h-7 sm:h-8 w-auto object-contain" />
            </div>
            <span className="hidden sm:inline-block text-[10px] font-bold font-mono uppercase tracking-widest text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
              Retail OS
            </span>
          </Link>

          {/* Nav links */}
          <div className="hidden md:flex items-center gap-7 text-xs font-semibold text-slate-600">
            <a href="#features" className="hover:text-blue-600 transition-colors">Features</a>
            <a href="#speed" className="hover:text-blue-600 transition-colors">Why 0.8s?</a>
            <a href="#pricing" className="hover:text-blue-600 transition-colors">Pricing</a>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {user ? (
              <Link
                to="/app/pos"
                className="h-9 px-4 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-blue-500/25 transition-all cursor-pointer"
              >
                <span>Launch POS</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-1.5 transition-colors hidden sm:block"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="h-9 px-4.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-blue-500/25 active:scale-95 transition-all cursor-pointer"
                >
                  <span>Get Started</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </>
            )}
          </div>
        </nav>
      </header>

      {/* 2. Hero Section */}
      <main className="relative z-10 pt-16 md:pt-24 pb-20 px-4 max-w-5xl mx-auto text-center">
        {/* Gen-Z Electric Pill */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-xs font-medium text-blue-700 mb-6 shadow-xs"
        >
          <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
          <span className="font-bold tracking-wide uppercase text-[10px]">Kivo Retail OS</span>
          <span className="text-slate-300">•</span>
          <span className="text-slate-700">0.8s Sub-Second Engine</span>
        </motion.div>

        {/* Main Punchy Headline */}
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight leading-[1.08] font-display max-w-4xl mx-auto text-slate-900"
        >
          Run Your Counter. <br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600">
            Kill The Queue.
          </span>
        </motion.h1>

        {/* Short, No-BS Subhead */}
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-6 text-sm sm:text-base text-slate-600 max-w-xl mx-auto leading-relaxed"
        >
          The lightning-fast billing software built for Indian retailers. 
          Instant keyboard checkout, ESC/POS thermal printing, and 1-tap WhatsApp Udhaar recovery. 
          <strong className="text-slate-900"> Zero lag. Zero bloat.</strong>
        </motion.p>

        {/* Hero CTAs */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5"
        >
          <Link
            to="/register"
            className="w-full sm:w-auto h-12 px-7 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-xl shadow-blue-500/25 flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
          >
            <span>Start Free Trial</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <button
            onClick={scrollToPricing}
            className="w-full sm:w-auto h-12 px-6 rounded-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-sm flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
          >
            <span>View Pricing (From ₹79/mo)</span>
          </button>
        </motion.div>

        {/* Social Proof Badges */}
        <div className="mt-8 flex items-center justify-center gap-6 text-[11px] text-slate-500">
          <div className="flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5 text-emerald-600" />
            <span>No Credit Card Required</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5 text-emerald-600" />
            <span>Instant Setup in 30 Seconds</span>
          </div>
          <div className="hidden sm:flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5 text-emerald-600" />
            <span>Works Offline & Online</span>
          </div>
        </div>

        {/* 3. Hero Visual — Terminal Glass Card */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-14 relative rounded-3xl p-1 bg-gradient-to-b from-blue-100/60 to-slate-200/40 shadow-2xl border border-slate-200/80"
        >
          <div className="bg-white rounded-[22px] border border-slate-200/80 p-5 sm:p-7 text-left overflow-hidden shadow-sm">
            {/* Window bar */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-400" />
                <div className="w-3 h-3 rounded-full bg-amber-400" />
                <div className="w-3 h-3 rounded-full bg-emerald-400" />
                <span className="text-[11px] text-slate-500 font-mono ml-2">kivo-pos-terminal • v3.0</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-emerald-700 font-mono bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>0.8s LATENCY</span>
              </div>
            </div>

            {/* Mock POS Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Counter details */}
              <div className="lg:col-span-2 bg-slate-50 rounded-2xl p-4 border border-slate-200/60 space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-500 font-medium pb-2 border-b border-slate-200/60">
                  <span>ITEM</span>
                  <span>QTY</span>
                  <span>PRICE</span>
                </div>
                <div className="space-y-2 text-xs font-mono">
                  <div className="flex justify-between items-center text-slate-700">
                    <span>Amul Butter (500g)</span>
                    <span className="text-slate-400">× 1</span>
                    <span className="font-bold text-slate-900">₹275.00</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-700">
                    <span>Aashirvaad Shudh Chakki Atta (10kg)</span>
                    <span className="text-slate-400">× 1</span>
                    <span className="font-bold text-slate-900">₹430.00</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-700">
                    <span>Tata Salt Lite (1kg)</span>
                    <span className="text-slate-400">× 2</span>
                    <span className="font-bold text-slate-900">₹84.00</span>
                  </div>
                </div>
                <div className="pt-3 border-t border-slate-200/60 flex items-center justify-between">
                  <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Total Amount</span>
                  <span className="text-xl font-black text-blue-600 font-mono">₹789.00</span>
                </div>
              </div>

              {/* Action Column */}
              <div className="bg-gradient-to-br from-blue-50/80 to-indigo-50/50 rounded-2xl p-4 border border-blue-200/60 flex flex-col justify-between space-y-3">
                <div>
                  <span className="text-[10px] uppercase font-bold text-blue-600 tracking-wider block">QUICK DISPATCH</span>
                  <p className="text-xs text-slate-600 mt-1">Press <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-800 font-mono text-[10px] shadow-xs">F6</kbd> to Instant Print</p>
                </div>

                <div className="space-y-2">
                  <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 shrink-0" />
                    <span className="text-[11px] font-medium">WhatsApp Bill Triggered</span>
                  </div>
                  <div className="p-2 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 text-xs flex items-center gap-2">
                    <Printer className="w-4 h-4 shrink-0" />
                    <span className="text-[11px] font-medium">58mm ESC/POS Spooled</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* 4. Feature Bento Grid (Pure Facts, No Fluff) */}
        <section id="features" className="mt-28 text-left">
          <div className="text-center max-w-md mx-auto mb-12">
            <span className="text-xs uppercase font-bold text-blue-600 tracking-widest block mb-2">
              WHY RETAILERS SWITCH
            </span>
            <h2 className="text-3xl sm:text-4xl font-black font-display tracking-tight text-slate-900">
              Engineered for the Counter.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Bento Card 1 */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 hover:border-blue-500/50 hover:shadow-xl transition-all shadow-xs group">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Keyboard className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold font-display text-slate-900">0.8s Keyboard Speed</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                F1 to search, F2 to change quantity, F6 to bill. Never touch a mouse during busy rush hours.
              </p>
            </div>

            {/* Bento Card 2 */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 hover:border-emerald-500/50 hover:shadow-xl transition-all shadow-xs group">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <MessageCircle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold font-display text-slate-900">WhatsApp Udhaar Khata</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                1-tap digital invoices and automatic payment reminders sent directly to customers on WhatsApp. Never lose credit.
              </p>
            </div>

            {/* Bento Card 3 */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 hover:border-purple-500/50 hover:shadow-xl transition-all shadow-xs group">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Printer className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold font-display text-slate-900">Thermal Hardware Native</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Plug & play with any standard 58mm or 80mm ESC/POS USB or Bluetooth thermal printer without installing drivers.
              </p>
            </div>
          </div>
        </section>

        {/* 5. Pricing Section (Clean, Transparent, No BS) */}
        <section id="pricing" className="mt-28">
          <div className="text-center max-w-md mx-auto mb-10">
            <span className="text-xs uppercase font-bold text-blue-600 tracking-widest block mb-2">
              PRICING
            </span>
            <h2 className="text-3xl sm:text-4xl font-black font-display tracking-tight text-slate-900">
              Honest Plans. Zero Hidden Fees.
            </h2>
            <p className="text-xs text-slate-500 mt-2">
              Start free. Upgrade when your shop scales.
            </p>

            {/* Monthly / Annual Switcher */}
            <div className="mt-6 inline-flex p-1 bg-slate-100 border border-slate-200 rounded-full">
              <button
                onClick={() => setBillingCycle("monthly")}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  billingCycle === "monthly" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-900"
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle("annual")}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  billingCycle === "annual" ? "bg-blue-600 text-white shadow-xs" : "text-slate-500 hover:text-slate-900"
                }`}
              >
                <span>Annual</span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-1.5 py-0.2 rounded-full">20% OFF</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left max-w-4xl mx-auto">
            {/* Starter Plan */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 flex flex-col justify-between shadow-xs">
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Starter</span>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-3xl font-black font-display text-slate-900">
                    ₹{billingCycle === "monthly" ? "79" : "799"}
                  </span>
                  <span className="text-xs text-slate-500">/{billingCycle === "monthly" ? "mo" : "yr"}</span>
                </div>
                <p className="text-xs text-slate-500 mt-2">For single-counter shops & solo retail counters.</p>

                <ul className="mt-6 space-y-2.5 text-xs text-slate-600">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Fast POS Billing Engine</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Unlimited Products & Inventory</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Basic Order History</span>
                  </li>
                </ul>
              </div>

              <Link
                to="/subscribe?plan=starter"
                className="mt-8 w-full h-11 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold text-xs flex items-center justify-center transition-all cursor-pointer"
              >
                Choose Starter
              </Link>
            </div>

            {/* Business Plan (Highlighted Card) */}
            <div className="relative bg-white border-2 border-blue-600 rounded-3xl p-6 flex flex-col justify-between shadow-2xl shadow-blue-500/10">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full shadow-md">
                MOST POPULAR
              </div>

              <div>
                <span className="text-xs font-bold text-blue-600 uppercase tracking-wider block">Business</span>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-3xl font-black font-display text-slate-900">
                    ₹{billingCycle === "monthly" ? "119" : "1,199"}
                  </span>
                  <span className="text-xs text-slate-500">/{billingCycle === "monthly" ? "mo" : "yr"}</span>
                </div>
                <p className="text-xs text-slate-600 mt-2">The complete suite with thermal printing & khata.</p>

                <ul className="mt-6 space-y-2.5 text-xs text-slate-700">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-blue-600 shrink-0" />
                    <span className="font-semibold text-slate-900">All Starter features</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>58mm / 80mm Thermal Receipts</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>WhatsApp Udhaar Khata Reminders</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Daily Profit & Expense Analytics</span>
                  </li>
                </ul>
              </div>

              <Link
                to="/subscribe?plan=business"
                className="mt-8 w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-600/25 active:scale-95 transition-all cursor-pointer"
              >
                <span>Upgrade to Business</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Pro / Annual VIP Plan */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 flex flex-col justify-between shadow-xs">
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Annual VIP</span>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-3xl font-black font-display text-slate-900">
                    ₹1,499
                  </span>
                  <span className="text-xs text-slate-500">/year</span>
                </div>
                <p className="text-xs text-slate-500 mt-2">Full year access with priority phone support.</p>

                <ul className="mt-6 space-y-2.5 text-xs text-slate-600">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Complete 12-Month Access</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Custom Shop Name & Logo on Bill</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Priority WhatsApp Onboarding</span>
                  </li>
                </ul>
              </div>

              <Link
                to="/subscribe?plan=premium"
                className="mt-8 w-full h-11 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold text-xs flex items-center justify-center transition-all cursor-pointer"
              >
                Choose Annual VIP
              </Link>
            </div>
          </div>
        </section>

        {/* Kivo Product Family */}
        <section className="mt-24 max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-600 text-[10px] font-black uppercase tracking-[0.18em]">
              Kivo Ecosystem
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-black font-display text-slate-900 tracking-tight">
              One brand. Multiple tools.
            </h2>
            <p className="mt-3 text-sm text-slate-500 max-w-xl mx-auto">
              Explore the Kivo products built for retail operations, teams, subscriptions and merchant workflows.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {[
              { src: "/kivo-pro.png", alt: "Kivo Pro", href: "/pro-plan" },
              { src: "/kivo-premium.png", alt: "Kivo Premium", href: "/premium-plan" },
              { src: "/kivo-cafe.png", alt: "Kivo Cafe Plan", href: "/subscribe?plan=cafe" },
              { src: "/kivo-pro-studio.png", alt: "Kivo Pro Studio", href: "/pro-studio" },
              { src: "/kivo-ai.png", alt: "Kivo AI", href: "/pro-studio" },
              { src: "/kivo-grid.png", alt: "Kivo Grid", href: "/app" },
              { src: "/kivo-admin.png", alt: "Kivo Admin", href: "/admin" },
            ].map((item) => (
              <Link
                key={item.alt}
                to={item.href}
                className="group min-h-24 rounded-2xl border border-slate-200 bg-white p-4 flex items-center justify-center shadow-xs hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md transition-all"
              >
                <img
                  src={item.src}
                  alt={item.alt}
                  className="max-h-14 max-w-full w-auto object-contain transition-transform group-hover:scale-[1.03]"
                  loading="lazy"
                />
              </Link>
            ))}
          </div>
        </section>

        {/* 6. Direct WhatsApp Floating Action */}
        <div className="mt-24 p-8 rounded-3xl bg-gradient-to-r from-emerald-50 via-white to-blue-50 border border-emerald-200/80 text-center max-w-3xl mx-auto shadow-sm">
          <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center mb-3">
            <MessageCircle className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold font-display text-slate-900">Need help setting up your store?</h3>
          <p className="text-xs text-slate-600 mt-1.5 max-w-md mx-auto">
            Speak directly with our team on WhatsApp for hardware support, barcode scanners, or thermal printer setup.
          </p>
          <a
            href="https://wa.me/919876543210?text=Hi%2C%20I%20want%20to%20set%20up%20Kivo%20POS%20for%20my%20shop"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-flex items-center gap-2 h-11 px-6 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 active:scale-95 transition-all cursor-pointer"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Chat on WhatsApp (Instant Reply)</span>
          </a>
        </div>
      </main>

      {/* 7. Clean Minimalist Footer */}
      <footer className="border-t border-slate-200 py-10 text-center text-xs text-slate-500 relative z-10 bg-white/50">
        <div className="flex justify-center mb-5">
          <div className="flex items-center px-3 py-1 rounded-xl bg-white shadow-xs border border-slate-200/60">
            <img src="/kivo-logo.png" alt="Kivo" className="h-7 w-auto object-contain" />
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-6 mb-3 text-slate-500 font-medium">
          <Link to="/privacy-policy" className="hover:text-blue-600 transition-colors">Privacy Policy</Link>
          <Link to="/refund-policy" className="hover:text-blue-600 transition-colors">Refund Policy</Link>
          <a href="mailto:contact@officialdukaan.in" className="hover:text-blue-600 transition-colors">Support</a>
        </div>
        <p className="font-mono text-[11px] text-slate-400">© 2026 Kivo · Business Made Simple · All rights reserved.</p>
      </footer>
    </div>
  );
}
