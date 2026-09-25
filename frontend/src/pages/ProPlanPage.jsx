import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  Crown, 
  ShieldCheck, 
  Lock, 
  Clock, 
  Volume2, 
  Bot, 
  Sparkles, 
  Check, 
  ArrowRight, 
  Sliders, 
  Receipt, 
  Share2, 
  Printer, 
  ChevronRight, 
  ArrowLeft,
  Store,
  Zap,
  HelpCircle,
  PhoneCall,
  CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import Card3D from "@/components/Card3D";
import { playVoiceSoundbox } from "@/lib/soundbox";

export default function ProPlanPage() {
  const nav = useNavigate();
  const [activeLang, setActiveLang] = useState("hi");
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const [simulatedPin, setSimulatedPin] = useState(["4", "8", "2", "9"]);
  const [pinUnlocked, setPinUnlocked] = useState(false);

  const handleTestVoice = (lang) => {
    setActiveLang(lang);
    setIsPlayingVoice(true);
    playVoiceSoundbox(499, "upi", lang);
    setTimeout(() => setIsPlayingVoice(false), 2400);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans antialiased selection:bg-blue-600 selection:text-white">
      
      {/* =========================================================
          TOP NAVBAR
      ========================================================= */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between gap-4">
          
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-2 group">
              <img src="/kivo-logo.png" alt="Kivo" className="h-9 sm:h-10 w-auto object-contain transition-transform group-hover:scale-105" />
              <div className="hidden sm:flex flex-col border-l border-slate-200 pl-2.5">
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 font-mono leading-none">by</span>
                <span className="text-xs font-black tracking-tight text-slate-900 leading-tight">PEAN</span>
              </div>
            </Link>

            <span className="hidden md:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold">
              <Crown className="w-3.5 h-3.5 text-blue-600" />
              <span>Kivo Pro Plan</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link 
              to="/pro-studio"
              className="text-xs sm:text-sm font-bold text-slate-700 hover:text-blue-600 flex items-center gap-1.5 transition-colors px-3 py-2 rounded-xl hover:bg-slate-100"
            >
              <Sliders className="w-4 h-4 text-blue-600" />
              <span className="hidden sm:inline">Explore</span>
              <span>Pro Studio</span>
            </Link>

            <Link 
              to="/subscribe?plan=pro"
              className="px-5 sm:px-6 h-10 sm:h-11 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm active:scale-95 transition-all shadow-md shadow-blue-500/20 flex items-center gap-2"
            >
              <span>Get Pro (₹499/mo)</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

        </div>
      </header>

      {/* =========================================================
          HERO SECTION: DUKAAN PRO PLAN
      ========================================================= */}
      <section className="relative overflow-hidden pt-12 sm:pt-20 pb-16 lg:pb-24 border-b border-slate-200 bg-gradient-to-b from-blue-50/40 via-white to-white">
        
        {/* Ambient background glow */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-r from-blue-400/15 via-indigo-400/10 to-sky-400/15 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center relative z-10">
          
          {/* Official Kivo Pro Brand Logo */}
          <div className="mb-4 inline-flex items-center gap-2 bg-slate-950 px-4 py-2 rounded-2xl border border-slate-800 shadow-md">
            <img src="/kivo-pro.png" alt="Kivo Pro" className="h-8 sm:h-10 w-auto object-contain" />
          </div>

          {/* Eyebrow badge */}
          <div className="block">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-black uppercase tracking-widest mb-6 shadow-2xs">
              <Crown className="w-4 h-4 text-blue-600" />
              <span>The Enterprise Tier for High-Volume Stores</span>
            </div>
          </div>

          {/* Headline */}
          <h1 className="font-sans font-black text-4xl sm:text-6xl lg:text-7xl tracking-[-0.03em] leading-[1.05] text-slate-950 max-w-4xl mx-auto">
            Scale Your Store with <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800">
              Kivo Pro Plan.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mt-6 text-lg sm:text-xl text-slate-600 font-normal max-w-2xl mx-auto leading-relaxed">
            Built specifically for busy Kiranas, supermarkets, pharmacies, and hardware stores. 
            Protect wholesale costs from staff, eliminate register cash discrepancies with F9 shift reconciliation, announce UPI payments aloud, and access the complete <strong>Dukaan Pro Studio</strong>.
          </p>

          {/* Pricing & CTA Banner */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              to="/subscribe?plan=pro"
              className="w-full sm:w-auto h-14 px-9 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-base active:scale-95 transition-all shadow-xl shadow-blue-500/25 flex items-center justify-center gap-2.5"
            >
              <Crown className="w-5 h-5 text-amber-300" />
              <span>Upgrade to Dukaan Pro — ₹499/month</span>
              <ArrowRight className="w-5 h-5" />
            </Link>

            <Link 
              to="/pro-studio"
              className="w-full sm:w-auto h-14 px-8 rounded-full bg-white hover:bg-slate-50 border-2 border-slate-200 hover:border-blue-600 text-slate-800 hover:text-blue-600 font-bold text-base active:scale-95 transition-all shadow-xs flex items-center justify-center gap-2"
            >
              <Sliders className="w-5 h-5 text-blue-600" />
              <span>Explore Pro Studio →</span>
            </Link>
          </div>

          {/* Key Trust Perks */}
          <div className="mt-8 flex items-center justify-center gap-6 text-xs font-semibold text-slate-500 flex-wrap">
            <span className="flex items-center gap-1.5 text-blue-700 font-bold">
              <CheckCircle2 className="w-4 h-4 text-blue-600" /> 1+1 Month Free Launch Offer
            </span>
            <span>·</span>
            <span className="flex items-center gap-1.5 text-slate-700">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Full Pro Studio Included
            </span>
            <span>·</span>
            <span className="flex items-center gap-1.5 text-slate-700">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Zero Hardware & Zero Setup Fee
            </span>
          </div>

        </div>
      </section>

      {/* =========================================================
          FEATURE 1: CASHIER MODE & MASTER PIN SECURITY
      ========================================================= */}
      <section className="py-20 max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Text */}
          <div className="lg:col-span-6 space-y-5">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold uppercase tracking-wider">
              <Lock className="w-3.5 h-3.5 text-amber-600" />
              <span>Counter Theft Prevention</span>
            </div>
            
            <h2 className="font-sans font-black text-3xl sm:text-4xl text-slate-900 tracking-tight leading-tight">
              Cashier Mode with <br />
              <span className="text-blue-600">4-Digit Master Owner PIN.</span>
            </h2>

            <p className="text-base text-slate-600 leading-relaxed font-normal">
              When your shop helpers, sales boys, or hired cashiers manage the counter, you never have to worry about sensitive financial data leaking or dishonest billing manipulation.
            </p>

            <ul className="space-y-3 pt-2">
              {[
                { title: "Hide Wholesale Purchase Prices", desc: "Staff only sees the selling price (MRP). Margin percentages and supplier purchase costs are masked." },
                { title: "Block Unauthorized Order Deletions", desc: "No cashier can cancel a bill or delete an order after taking cash without the Owner PIN." },
                { title: "Prevent Illegal Item Rate Editing", desc: "Selling prices cannot be altered on the fly during counter billing without owner authorization." }
              ].map((item, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                  <div>
                    <strong className="text-sm font-bold text-slate-900 block">{item.title}</strong>
                    <span className="text-xs text-slate-600">{item.desc}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Right Interactive Simulation Card */}
          <div className="lg:col-span-6">
            <Card3D depth={14} glow={true} className="w-full">
              <div className="bg-white rounded-3xl border-2 border-slate-200 p-6 sm:p-8 shadow-xl relative overflow-hidden">
                <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-6">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center">
                      <Lock className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black uppercase text-slate-900">Security Gate Simulator</h4>
                      <p className="text-[11px] text-slate-500">Try deleting an order in Cashier Mode</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-bold bg-amber-100 text-amber-900 px-2.5 py-1 rounded-full border border-amber-300">
                    PIN LOCKED
                  </span>
                </div>

                <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-4">
                  <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-200 text-xs">
                    <div>
                      <div className="font-bold text-slate-900">Bill #OD-1049 · ₹1,240.00</div>
                      <div className="text-[10px] text-slate-500">Cashier: Rohan · 10 mins ago</div>
                    </div>
                    <button
                      onClick={() => setPinUnlocked(prev => !prev)}
                      className="px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 text-xs font-bold transition-all"
                    >
                      Delete Order 🗑️
                    </button>
                  </div>

                  {pinUnlocked ? (
                    <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-center animate-fade-in">
                      <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto mb-2">
                        <Check className="w-6 h-6" />
                      </div>
                      <h5 className="font-bold text-emerald-900 text-sm">Master Owner PIN Verified!</h5>
                      <p className="text-xs text-emerald-700 mt-0.5">Order safely unlocked for owner modification.</p>
                      <button 
                        onClick={() => setPinUnlocked(false)} 
                        className="mt-3 text-xs font-bold text-emerald-800 underline"
                      >
                        Reset Lock
                      </button>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-white border border-slate-200 text-center space-y-3">
                      <div className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center justify-center gap-1.5">
                        <Lock className="w-4 h-4 text-amber-600" />
                        <span>Owner 4-Digit PIN Required</span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Counter staff cannot delete this bill without owner permission.
                      </p>
                      <div className="flex justify-center gap-2">
                        {["4", "8", "2", "9"].map((digit, i) => (
                          <div key={i} className="w-10 h-12 rounded-xl bg-slate-100 border border-slate-300 flex items-center justify-center font-mono font-black text-lg text-slate-800 shadow-inner">
                            {digit}
                          </div>
                        ))}
                      </div>
                      <button
                        onClick={() => setPinUnlocked(true)}
                        className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-sm"
                      >
                        Simulate Owner Verification
                      </button>
                    </div>
                  )}
                </div>

              </div>
            </Card3D>
          </div>

        </div>
      </section>

      {/* =========================================================
          FEATURE 2: SHIFT HANDOVER & CASH DRAWER RECONCILIATION (F9)
      ========================================================= */}
      <section className="py-20 bg-slate-50 border-y border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Handover Slip Preview */}
            <div className="lg:col-span-6 order-2 lg:order-1">
              <Card3D depth={14} glow={true} className="w-full">
                <div className="bg-white rounded-3xl border-2 border-purple-200 p-6 sm:p-7 shadow-xl font-mono text-xs text-slate-800 space-y-3">
                  <div className="flex items-center justify-between pb-3 border-b border-dashed border-slate-300">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-purple-600" />
                      <span className="font-bold uppercase tracking-wider text-purple-900">Shift Handover Summary</span>
                    </div>
                    <span className="text-[10px] font-bold bg-purple-100 text-purple-800 px-2 py-0.5 rounded">F9 KEY</span>
                  </div>

                  <div className="text-center py-1">
                    <div className="font-black text-sm uppercase">APNA SUPER STORE</div>
                    <div className="text-[10px] text-slate-500">Shift: 08:00 AM — 04:00 PM (8 Hours)</div>
                    <div className="text-[10px] text-slate-500">Cashier: Ramesh Bhai · Register #01</div>
                  </div>

                  <div className="border-t border-b border-dashed border-slate-300 py-2 space-y-1.5 text-[11px]">
                    <div className="flex justify-between">
                      <span>Opening Float Cash:</span>
                      <span className="font-bold">₹2,000.00</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Cash Billing (42 bills):</span>
                      <span className="font-bold text-emerald-700">+₹14,580.00</span>
                    </div>
                    <div className="flex justify-between">
                      <span>UPI Digital Sales (68 bills):</span>
                      <span className="font-bold text-blue-700">₹23,410.00</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Supplier Cash Payouts:</span>
                      <span className="font-bold text-rose-700">-₹1,200.00</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-purple-50 border border-purple-200 space-y-1 text-xs">
                    <div className="flex justify-between font-bold text-purple-950">
                      <span>Expected Drawer Cash:</span>
                      <span>₹15,380.00</span>
                    </div>
                    <div className="flex justify-between font-bold text-slate-700">
                      <span>Physical Cash Counted:</span>
                      <span>₹15,380.00</span>
                    </div>
                    <div className="flex justify-between font-black text-emerald-700 pt-1 border-t border-purple-200 text-xs">
                      <span>DISCREPANCY / SHORTAGE:</span>
                      <span>₹0.00 (PERFECT MATCH ✅)</span>
                    </div>
                  </div>

                  <div className="text-center text-[10px] text-slate-500 pt-1">
                    📲 Summary auto-dispatched to Owner's WhatsApp (+91 98XXX XXXXX)
                  </div>
                </div>
              </Card3D>
            </div>

            {/* Right Text */}
            <div className="lg:col-span-6 order-1 lg:order-2 space-y-5">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-50 border border-purple-200 text-purple-900 text-xs font-bold uppercase tracking-wider">
                <Clock className="w-3.5 h-3.5 text-purple-600" />
                <span>Zero Cash Leakage</span>
              </div>

              <h2 className="font-sans font-black text-3xl sm:text-4xl text-slate-900 tracking-tight leading-tight">
                Shift Handover & Drawer Cash <br />
                <span className="text-purple-600">Reconciliation (F9 Key).</span>
              </h2>

              <p className="text-base text-slate-600 leading-relaxed font-normal">
                Never spend hours counting cash after closing time. When shifts change or at closing, press <strong>F9</strong> to automatically calculate what should be in the drawer versus what was counted.
              </p>

              <ul className="space-y-3 pt-2">
                {[
                  { title: "Detect Cash Shortages Instantly", desc: "Catch counter discrepancies immediately before the cashier leaves the premises." },
                  { title: "One-Tap Thermal Handover Print", desc: "Print clean 58mm/80mm shift handover slips for physical store records." },
                  { title: "Automated WhatsApp Daily Dispatch", desc: "The store owner receives total cash collected, UPI total, and margins right on WhatsApp." }
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                    <div>
                      <strong className="text-sm font-bold text-slate-900 block">{item.title}</strong>
                      <span className="text-xs text-slate-600">{item.desc}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

          </div>
        </div>
      </section>

      {/* =========================================================
          FEATURE 3: VIRTUAL SOUNDBOX VOICE ANNOUNCEMENTS
      ========================================================= */}
      <section className="py-20 max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Text */}
          <div className="lg:col-span-6 space-y-5">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold uppercase tracking-wider">
              <Volume2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Save ₹1,800/year on Speakers</span>
            </div>

            <h2 className="font-sans font-black text-3xl sm:text-4xl text-slate-900 tracking-tight leading-tight">
              Virtual Voice Soundbox <br />
              <span className="text-emerald-600">Built Into Your Computer.</span>
            </h2>

            <p className="text-base text-slate-600 leading-relaxed font-normal">
              Why pay ₹150 every month for rental hardware soundbox speakers? Dukaan Pro announces every UPI and Cash payment aloud through your existing PC, counter monitor, or Bluetooth speaker in crystal clear Indian languages.
            </p>

            {/* Language Selection Test Buttons */}
            <div className="p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-3">
              <span className="text-xs font-extrabold text-emerald-950 block uppercase tracking-wider">
                🎧 Click to Test Live Soundbox Audio in Your Browser:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { id: "hi", name: "Hindi (हिंदी)" },
                  { id: "gu", name: "Gujarati (ગુજરાતી)" },
                  { id: "en", name: "English" },
                  { id: "mr", name: "Marathi (मराठी)" },
                  { id: "ta", name: "Tamil (தமிழ்)" }
                ].map((l) => (
                  <button
                    key={l.id}
                    onClick={() => handleTestVoice(l.id)}
                    disabled={isPlayingVoice}
                    className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                      activeLang === l.id && isPlayingVoice
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-md scale-105 animate-pulse"
                        : "bg-white text-emerald-900 border-emerald-200 hover:bg-emerald-100/60"
                    }`}
                  >
                    <Volume2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{l.name}</span>
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* Right Comparison Box */}
          <div className="lg:col-span-6">
            <Card3D depth={14} glow={true} className="w-full">
              <div className="bg-white rounded-3xl border-2 border-slate-200 p-6 sm:p-8 shadow-xl space-y-6">
                <h3 className="font-bold text-lg text-slate-900 text-center">
                  Hardware Soundbox vs Dukaan Virtual Soundbox
                </h3>

                <div className="space-y-3 text-xs">
                  <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200 space-y-2">
                    <div className="font-extrabold text-rose-900 flex items-center justify-between">
                      <span>Traditional External Soundbox Device</span>
                      <span className="text-rose-700">₹150 - ₹200 / month</span>
                    </div>
                    <p className="text-rose-800/80 leading-relaxed">
                      Requires battery charging daily, external SIM card with network recharge, hardware damage repairs, and annoying monthly rental fee.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 space-y-2 shadow-xs">
                    <div className="font-extrabold text-emerald-950 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Crown className="w-4 h-4 text-emerald-600" />
                        <span>Dukaan Pro Virtual Soundbox</span>
                      </span>
                      <span className="text-emerald-700 font-black">₹0 Extra Cost</span>
                    </div>
                    <p className="text-emerald-900/80 leading-relaxed">
                      100% built into Dukaan Pro. Works instantly through laptop/desktop speakers or wired counter speaker. Zero SIM, zero battery hassle, zero monthly rental.
                    </p>
                  </div>
                </div>

                <div className="text-center pt-2">
                  <div className="inline-flex items-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-100/60 px-4 py-1.5 rounded-full border border-emerald-200">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Included Free with Dukaan Pro Plan</span>
                  </div>
                </div>

              </div>
            </Card3D>
          </div>

        </div>
      </section>

      {/* =========================================================
          FEATURE 4: AI RESTOCK VELOCITY PREDICTOR
      ========================================================= */}
      <section className="py-20 bg-slate-50 border-y border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            
            {/* Left AI Restock Card */}
            <div className="lg:col-span-6">
              <Card3D depth={14} glow={true} className="w-full">
                <div className="bg-white rounded-3xl border-2 border-amber-200 p-6 sm:p-7 shadow-xl space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                    <div className="flex items-center gap-2">
                      <Bot className="w-5 h-5 text-amber-600" />
                      <span className="font-bold text-xs uppercase tracking-wider text-slate-900">
                        AI Restock Velocity Forecast
                      </span>
                    </div>
                    <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded">
                      Live Prediction
                    </span>
                  </div>

                  <div className="space-y-3">
                    {[
                      { item: "Amul Butter 100g", velocity: "14 units/day", stock: "18 left", days: "1.2 days", alert: "Critical Reorder Today", badge: "bg-rose-100 text-rose-800" },
                      { item: "Fortune Sunlite Oil 1L", velocity: "8 units/day", stock: "32 left", days: "4.0 days", alert: "Order in 2 Days", badge: "bg-amber-100 text-amber-800" },
                      { item: "Tata Tea Gold 250g", velocity: "5 units/day", stock: "60 left", days: "12 days", alert: "Sufficient Stock", badge: "bg-emerald-100 text-emerald-800" }
                    ].map((row, idx) => (
                      <div key={idx} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 text-xs">
                        <div>
                          <div className="font-extrabold text-slate-900">{row.item}</div>
                          <div className="text-[11px] text-slate-500 mt-0.5">Velocity: {row.velocity} · Stock: {row.stock}</div>
                        </div>
                        <div className="text-right">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${row.badge}`}>
                            {row.days} left
                          </span>
                          <div className="text-[10px] text-slate-600 font-medium mt-1">{row.alert}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="text-center text-[10px] text-slate-500 pt-1">
                    Powered by KiranaSales moving average predictive modeling.
                  </div>
                </div>
              </Card3D>
            </div>

            {/* Right Text */}
            <div className="lg:col-span-6 space-y-5">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold uppercase tracking-wider">
                <Bot className="w-3.5 h-3.5 text-amber-600" />
                <span>Smart Kirana AI</span>
              </div>

              <h2 className="font-sans font-black text-3xl sm:text-4xl text-slate-900 tracking-tight leading-tight">
                AI Restock Velocity Predictor. <br />
                <span className="text-amber-600">Never Run Out of Milk or Oil.</span>
              </h2>

              <p className="text-base text-slate-600 leading-relaxed font-normal">
                Don't wait until an angry customer asks for a product and you find the shelf empty. Dukaan Pro calculates daily sales velocity to predict exact reorder dates before stockouts occur.
              </p>

              <ul className="space-y-3 pt-2">
                {[
                  { title: "Predictive Depletion Modeling", desc: "Learns which items sell faster on weekends or festival days." },
                  { title: "Wholesale Reorder Quantity Suggestions", desc: "Suggests the optimal batch quantity to order from your distributor to avoid tied-up cash." },
                  { title: "Early Morning Low-Stock WhatsApp Alert", desc: "Wake up to an automatic summary of items that need distributor restocking today." }
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                    <div>
                      <strong className="text-sm font-bold text-slate-900 block">{item.title}</strong>
                      <span className="text-xs text-slate-600">{item.desc}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

          </div>
        </div>
      </section>

      {/* =========================================================
          FEATURE 5: PRO STUDIO INCLUDED
      ========================================================= */}
      <section className="py-20 max-w-6xl mx-auto px-4 sm:px-6">
        <div className="rounded-[36px] bg-gradient-to-b from-blue-600 via-blue-700 to-indigo-900 p-8 sm:p-12 text-white text-center relative overflow-hidden shadow-2xl">
          
          {/* Subtle lighting */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-400/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="max-w-3xl mx-auto relative z-10 space-y-5">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 border border-white/20 text-cyan-200 text-xs font-bold uppercase tracking-wider backdrop-blur-md">
              <Sliders className="w-3.5 h-3.5 text-cyan-200" />
              <span>Full Access Included</span>
            </div>

            <h2 className="font-sans font-black text-3xl sm:text-5xl tracking-tight leading-tight text-white">
              Every Pro Plan Subscriber Gets <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-200 via-white to-amber-200">
                Dukaan Pro Studio Access.
              </span>
            </h2>

            <p className="text-blue-100 text-base sm:text-lg leading-relaxed font-normal max-w-2xl mx-auto">
              Design custom 58mm & 80mm thermal receipts, print your shop's UPI QR code directly on invoices, add custom warranty policies, upload logos, and customize counter colors.
            </p>

            <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
              <Link
                to="/pro-studio"
                className="h-13 px-8 rounded-full bg-white text-blue-800 hover:bg-slate-50 font-extrabold text-sm shadow-lg transition-all active:scale-95 flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span>Explore Dukaan Pro Studio</span>
                <ArrowRight className="w-4 h-4 text-blue-600" />
              </Link>

              <Link
                to="/subscribe?plan=pro"
                className="h-13 px-8 rounded-full bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-sm shadow-xl shadow-amber-400/25 transition-all active:scale-95 flex items-center gap-2"
              >
                <Crown className="w-4 h-4 text-slate-950" />
                <span>Get Pro Plan (₹499/mo)</span>
                <ArrowRight className="w-4 h-4 text-slate-950" />
              </Link>
            </div>
          </div>

        </div>
      </section>

      {/* =========================================================
          COMPARISON TABLE (Starter vs Business vs Premium vs Pro)
      ========================================================= */}
      <section className="py-20 bg-white border-t border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold uppercase tracking-wider mb-3">
              Plan Comparison
            </div>
            <h2 className="font-sans font-black text-3xl sm:text-4xl text-slate-900">
              Compare All 4 Dukaan Plans
            </h2>
            <p className="mt-2 text-slate-600 text-sm">
              From small single-counter shops to high-volume multi-staff supermarkets.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b-2 border-slate-200">
                  <th className="py-4 px-3 sm:px-4 font-bold text-slate-500">FEATURE</th>
                  <th className="py-4 px-3 sm:px-4 font-bold text-slate-700 text-center">Starter (₹79)</th>
                  <th className="py-4 px-3 sm:px-4 font-bold text-slate-700 text-center">Business (₹119)</th>
                  <th className="py-4 px-3 sm:px-4 font-bold text-slate-900 text-center bg-slate-50/80">Premium (₹239)</th>
                  <th className="py-4 px-3 sm:px-4 font-black text-blue-700 text-center bg-blue-50/70 rounded-t-2xl">
                    Dukaan Pro (₹499)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[
                  { name: "Fast POS Billing & Receipts", starter: "✓", business: "✓", premium: "✓ Full", pro: "✓ Unlimited" },
                  { name: "Inventory & Low Stock Alerts", starter: "✓", business: "✓", premium: "✓", pro: "✓ Live Sync" },
                  { name: "Customer Khata & WhatsApp Reminders", starter: "Basic", business: "✓ Full", premium: "✓ Priority", pro: "✓ Priority FIFO" },
                  { name: "Multi-Shop Headquarter Support", starter: "—", business: "—", premium: "✓ Up to 3 Shops", pro: "✓ Unlimited Multi-branch" },
                  { name: "FY Tax & Profit Audit Reports", starter: "—", business: "Basic", premium: "✓ Full FY Audit", pro: "✓ Full Audit & AI" },
                  { name: "Cashier Mode & Master Owner PIN", starter: "—", business: "—", premium: "—", pro: "✓ Full Protection" },
                  { name: "Shift Handover Reconciliation (F9)", starter: "—", business: "—", premium: "—", pro: "✓ Thermal & WhatsApp" },
                  { name: "Built-in Voice Soundbox Audio", starter: "—", business: "—", premium: "Soundbox Alerts", pro: "✓ Multi-lingual Voice" },
                  { name: "AI Restock Velocity Predictor", starter: "—", business: "—", premium: "—", pro: "✓ SmartKirana AI" },
                  { name: "Dukaan Pro Studio Access", starter: "—", business: "—", premium: "—", pro: "✓ Full Studio Suite" },
                  { name: "24/7 Dedicated Support", starter: "Standard", business: "Standard", premium: "Priority Email", pro: "✓ VIP Priority WhatsApp" }
                ].map((r, i) => (
                  <tr key={i} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-3 sm:px-4 font-bold text-slate-800">{r.name}</td>
                    <td className="py-3.5 px-3 sm:px-4 text-center text-slate-600">{r.starter}</td>
                    <td className="py-3.5 px-3 sm:px-4 text-center text-slate-600">{r.business}</td>
                    <td className="py-3.5 px-3 sm:px-4 text-center font-semibold text-slate-800 bg-slate-50/50">{r.premium}</td>
                    <td className="py-3.5 px-3 sm:px-4 text-center font-extrabold text-blue-700 bg-blue-50/50">
                      {r.pro}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* =========================================================
          FAQ SECTION
      ========================================================= */}
      <section className="py-20 max-w-4xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-10">
          <h2 className="font-sans font-black text-3xl text-slate-900">
            Frequently Asked Questions
          </h2>
          <p className="text-slate-600 text-sm mt-2">Everything you need to know about Dukaan Pro Plan.</p>
        </div>

        <Accordion type="single" collapsible className="space-y-3">
          {[
            {
              q: "Can I use Dukaan Pro on my laptop and desktop PC?",
              a: "Yes! Dukaan Pro runs natively on any modern browser across laptops, counter PCs, and tablets without requiring expensive specialized POS terminals."
            },
            {
              q: "How does the 1+1 Month Free offer work?",
              a: "When you subscribe to Dukaan Pro for ₹499 today, your subscription is automatically extended for 60 full days (2 months for the price of 1) with zero setup fees."
            },
            {
              q: "Can my counter cashiers see how much profit I make?",
              a: "No! Once Cashier Mode is toggled ON with your 4-digit Master Owner PIN, all purchase wholesale rates, margins, and profit graphs are strictly hidden from the counter staff."
            },
            {
              q: "Do I need to buy an external soundbox machine?",
              a: "No! Dukaan Pro has a Virtual Soundbox built directly into the software. It announces payment receipts in Hindi, Gujarati, Marathi, Tamil, or English through your PC's speakers."
            }
          ].map((item, idx) => (
            <AccordionItem key={idx} value={`item-${idx}`} className="bg-white rounded-2xl border border-slate-200 px-6 shadow-xs">
              <AccordionTrigger className="font-bold text-slate-900 text-left py-4 hover:no-underline">
                {item.q}
              </AccordionTrigger>
              <AccordionContent className="text-slate-600 text-sm pb-4 leading-relaxed font-normal">
                {item.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      {/* =========================================================
          FINAL ACTION BANNER
      ========================================================= */}
      <section className="py-16 bg-gradient-to-b from-white to-blue-50/50 border-t border-slate-200 text-center">
        <div className="max-w-3xl mx-auto px-4">
          <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center mx-auto mb-5 shadow-lg shadow-blue-500/25">
            <Crown className="w-9 h-9 fill-white/20 text-white" />
          </div>
          <h2 className="font-sans font-black text-3xl sm:text-5xl text-slate-950 tracking-tight">
            Take Your Business Further Today.
          </h2>
          <p className="mt-4 text-slate-600 text-base max-w-xl mx-auto leading-relaxed">
            Upgrade your store to Dukaan Pro for ₹499/mo and get 1+1 Month Free with instant Pro Studio activation.
          </p>
          <div className="mt-8 flex items-center justify-center gap-4">
            <Link
              to="/subscribe?plan=pro"
              className="h-14 px-10 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-base shadow-xl shadow-blue-500/25 active:scale-95 transition-all flex items-center gap-2"
            >
              <span>Activate Dukaan Pro Now</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* =========================================================
          FOOTER
      ========================================================= */}
      <footer className="border-t border-slate-200 bg-white py-10 text-center text-xs text-slate-500">
        <div className="flex items-center justify-center gap-3 mb-3">
          <img src="/kivo-logo.png" alt="Kivo" className="h-8 object-contain" />
          <div className="h-5 w-px bg-slate-200" />
          <span className="font-bold text-slate-800 text-sm">Kivo Pro Plan</span>
        </div>
        <p className="mb-4">Business Made Simple. A Product by PEAN.</p>
        <div className="flex justify-center gap-6 text-slate-600 font-medium">
          <Link to="/" className="hover:text-blue-600">Home</Link>
          <Link to="/pro-studio" className="hover:text-blue-600">Kivo Pro Studio</Link>
          <Link to="/subscribe" className="hover:text-blue-600">Pricing</Link>
          <Link to="/careers" className="hover:text-blue-600">Careers</Link>
          <Link to="/privacy-policy" className="hover:text-blue-600">Privacy Policy</Link>
        </div>
      </footer>

    </div>
  );
}
