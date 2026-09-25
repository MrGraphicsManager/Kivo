import React, { useState } from "react";
import { Link } from "react-router-dom";
import { 
  Sliders, 
  Crown, 
  Printer, 
  Receipt, 
  QrCode, 
  Sparkles, 
  Check, 
  ArrowRight, 
  Share2, 
  Palette, 
  Volume2, 
  FlaskConical, 
  CheckCircle2, 
  Lock,
  Store,
  FileText,
  Sun,
  ShieldCheck,
  Zap,
  HelpCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import Card3D from "@/components/Card3D";
import { playVoiceSoundbox } from "@/lib/soundbox";

export default function ProStudioPage() {
  const [template, setTemplate] = useState("thermal_compact");
  const [shopName, setShopName] = useState("Shree Balaji Super Kirana");
  const [shopPhone, setShopPhone] = useState("+91 98765 43210");
  const [shopGst, setShopGst] = useState("24AAACS1429B1Z8");
  const [footerNote, setFooterNote] = useState("Thank you for shopping! Exchange within 7 days with original bill.");
  const [showQr, setShowQr] = useState(true);
  const [showCashier, setShowCashier] = useState(true);
  const [activeTheme, setActiveTheme] = useState("indigo");
  const [isPlayingSoundbox, setIsPlayingSoundbox] = useState(false);

  const handleTestSoundbox = (lang) => {
    setIsPlayingSoundbox(true);
    playVoiceSoundbox(649, "upi", lang);
    setTimeout(() => setIsPlayingSoundbox(false), 2400);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans antialiased selection:bg-blue-600 selection:text-white">
      
      {/* =========================================================
          TOP NAVBAR
      ========================================================= */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b border-slate-200">
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
              <Sliders className="w-3.5 h-3.5 text-blue-600" />
              <span>Kivo Pro Studio</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link 
              to="/pro-plan"
              className="text-xs sm:text-sm font-bold text-slate-700 hover:text-blue-600 flex items-center gap-1.5 transition-colors px-3 py-2 rounded-xl hover:bg-slate-100"
            >
              <Crown className="w-4 h-4 text-blue-600" />
              <span className="hidden sm:inline">Explore</span>
              <span>Pro Plan</span>
            </Link>

            <Link 
              to="/subscribe?plan=pro"
              className="px-5 sm:px-6 h-10 sm:h-11 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs sm:text-sm active:scale-95 transition-all shadow-md shadow-blue-500/20 flex items-center gap-2"
            >
              <span>Unlock Studio (₹499/mo)</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

        </div>
      </header>

      {/* =========================================================
          HERO SECTION: DUKAAN PRO STUDIO
      ========================================================= */}
      <section className="relative overflow-hidden pt-12 sm:pt-20 pb-16 lg:pb-24 border-b border-slate-200 bg-gradient-to-b from-blue-50/40 via-white to-white">
        
        {/* Soft Ambient Radial Glow */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-r from-blue-500/15 via-cyan-400/10 to-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center relative z-10">
          
          {/* Official Kivo Pro Studio Brand Logo */}
          <div className="mb-4 inline-flex items-center gap-2 bg-slate-950 px-4 py-2 rounded-2xl border border-slate-800 shadow-md">
            <img src="/kivo-pro-studio.png" alt="Kivo Pro Studio" className="h-8 sm:h-10 w-auto object-contain" />
          </div>

          {/* Eyebrow badge with "Only for Pro Plan" handwritten note */}
          <div className="relative inline-block mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-black uppercase tracking-widest shadow-2xs">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>The Creative Customization Engine</span>
            </div>

            {/* Handwritten callout */}
            <div className="absolute -top-7 -right-24 sm:-right-28 hidden xs:flex items-center gap-1 pointer-events-none">
              <span className="font-['Caveat',cursive] text-2xl font-bold text-blue-600 -rotate-6 whitespace-nowrap">
                Only for Pro Plan
              </span>
              <svg className="w-6 h-6 text-blue-600 -rotate-12 translate-y-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4c4 8 12 10 14 12" />
                <path d="M14 16l4 0l-1-4" />
              </svg>
            </div>
          </div>

          {/* Headline */}
          <h1 className="font-sans font-black text-4xl sm:text-6xl lg:text-7xl tracking-[-0.03em] leading-[1.05] text-slate-950 max-w-4xl mx-auto">
            Customize. Configure. <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800">
              Make It Uniquely Yours.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mt-6 text-lg sm:text-xl text-slate-600 font-normal max-w-2xl mx-auto leading-relaxed">
            Every shop in India has its own identity. <strong>Kivo Pro Studio</strong> transforms ordinary billing into a memorable brand experience — with custom thermal receipts, store logo printing, dynamic UPI QR codes, warranty terms, and store color themes.
          </p>

          {/* Action CTAs */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a 
              href="#sandbox"
              className="w-full sm:w-auto h-14 px-9 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-base active:scale-95 transition-all shadow-xl shadow-blue-500/25 flex items-center justify-center gap-2.5"
            >
              <Printer className="w-5 h-5 text-cyan-200" />
              <span>Try Live Receipt Studio Demo ↓</span>
            </a>

            <Link 
              to="/subscribe?plan=pro"
              className="w-full sm:w-auto h-14 px-8 rounded-full bg-white hover:bg-slate-50 border-2 border-slate-200 hover:border-blue-600 text-slate-800 hover:text-blue-600 font-bold text-base active:scale-95 transition-all shadow-xs flex items-center justify-center gap-2"
            >
              <Crown className="w-5 h-5 text-blue-600" />
              <span>Unlock Studio with Pro Plan (₹499) →</span>
            </Link>
          </div>

          {/* Key Value Points */}
          <div className="mt-8 flex items-center justify-center gap-6 text-xs font-semibold text-slate-500 flex-wrap">
            <span className="flex items-center gap-1.5 text-blue-700 font-bold">
              <CheckCircle2 className="w-4 h-4 text-blue-600" /> 58mm & 80mm Receipt Formats
            </span>
            <span>·</span>
            <span className="flex items-center gap-1.5 text-slate-700">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Dynamic UPI QR on Every Bill
            </span>
            <span>·</span>
            <span className="flex items-center gap-1.5 text-slate-700">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> 100% Free with Dukaan Pro Plan
            </span>
          </div>

        </div>
      </section>

      {/* =========================================================
          SECTION 1: WHAT IS DUKAAN PRO STUDIO?
      ========================================================= */}
      <section className="py-20 max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold uppercase tracking-wider mb-3">
            <Store className="w-3.5 h-3.5 text-blue-600" />
            <span>Why Branding Matters</span>
          </div>
          <h2 className="font-sans font-black text-3xl sm:text-5xl text-slate-950 tracking-tight">
            Stop Giving Generic, Forgettable Bills.
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
            When a customer walks out of your shop with a blank paper slip, they forget who you are. 
            Dukaan Pro Studio turns every single transaction into a professional marketing asset that builds customer trust, brings repeat visits, and stops payment disputes.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              title: "Build Lifetime Customer Trust",
              desc: "Customers take receipts seriously when they feature your shop's official logo, clear GST breakdown, contact helpline, and return policy."
            },
            {
              title: "Zero-Touch Instant Payments",
              desc: "By printing a dynamic UPI QR code on the bottom of each bill, customers scan and pay the exact amount in 3 seconds without typing numbers."
            },
            {
              title: "Eliminate Return Arguments",
              desc: "Print your exact return policy on every receipt (e.g. 'Exchange within 7 days with bill') to protect your shop from unfair return disputes."
            }
          ].map((item, idx) => (
            <div key={idx} className="p-7 rounded-3xl bg-white border-2 border-slate-200 shadow-sm hover:border-blue-300 hover:shadow-md transition-all">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 font-black text-sm flex items-center justify-center mb-4 border border-blue-200">
                0{idx + 1}
              </div>
              <h3 className="font-bold text-lg text-slate-900 mb-2">{item.title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed font-normal">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* =========================================================
          SECTION 2: 4 MULTI-FORMAT RECEIPT ARCHITECT
      ========================================================= */}
      <section className="py-20 bg-slate-50 border-y border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold uppercase tracking-wider mb-3">
              <Printer className="w-3.5 h-3.5 text-blue-600" />
              <span>Multi-Format Receipt Engine</span>
            </div>
            <h2 className="font-sans font-black text-3xl sm:text-4xl text-slate-900 tracking-tight">
              4 Built-In Professional Billing Formats
            </h2>
            <p className="mt-2 text-slate-600 text-sm">
              Whether you have a mini Bluetooth printer, a supermarket POS terminal, or zero printers at all.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                id: "thermal_compact",
                tag: "2-INCH ROLL",
                title: "58mm Paper Saver",
                desc: "High-density thermal roll format. Saves up to 40% paper roll cost. Perfect for mini Bluetooth or USB counter printers in Kiranas, bakeries & tea stalls.",
                badge: "bg-amber-100 text-amber-900 border-amber-300"
              },
              {
                id: "thermal_standard",
                tag: "3-INCH POS",
                title: "80mm Standard POS",
                desc: "The retail gold standard used by major supermarkets. Itemized columns, discount savings banner, shift ID, and high-speed auto-cutter support.",
                badge: "bg-blue-100 text-blue-900 border-blue-300"
              },
              {
                id: "gst_tax",
                tag: "B2B / B2C",
                title: "Full GST Tax Invoice",
                desc: "Government compliant tax format with HSN/SAC code breakdown, CGST, SGST, IGST tax split, Buyer GSTIN, and Authorized Signatory seal.",
                badge: "bg-purple-100 text-purple-900 border-purple-300"
              },
              {
                id: "whatsapp",
                tag: "100% PAPERLESS",
                title: "WhatsApp Cash Memo",
                desc: "Zero-paper digital billing. Sends an automatic branded PDF and itemized message directly to the customer's WhatsApp with one tap.",
                badge: "bg-emerald-100 text-emerald-900 border-emerald-300"
              }
            ].map((fmt, i) => (
              <div 
                key={i} 
                onClick={() => setTemplate(fmt.id)}
                className={`p-6 rounded-3xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                  template === fmt.id
                    ? "bg-white border-blue-600 shadow-lg ring-2 ring-blue-500/20"
                    : "bg-white border-slate-200 hover:border-slate-300 shadow-xs"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className={`text-[10px] font-mono font-black px-2 py-0.5 rounded border ${fmt.badge}`}>
                      {fmt.tag}
                    </span>
                    {template === fmt.id && (
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-ping" />
                    )}
                  </div>
                  <h3 className="font-bold text-base text-slate-900 mb-2">{fmt.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed font-normal">{fmt.desc}</p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] font-extrabold text-blue-600 flex items-center gap-1">
                  <span>Click to Test Below</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================
          SECTION 3: INTERACTIVE LIVE SANDBOX
      ========================================================= */}
      <section className="py-20 max-w-6xl mx-auto px-4 sm:px-6" id="sandbox">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold uppercase tracking-wider mb-3">
            <Sliders className="w-3.5 h-3.5 text-blue-600" />
            <span>Interactive Studio Sandbox</span>
          </div>
          <h2 className="font-sans font-black text-3xl sm:text-4xl text-slate-900 tracking-tight">
            Design Your Custom Receipt in Real Time
          </h2>
          <p className="mt-2 text-slate-600 text-sm">
            Tweak your shop details, toggle UPI QR, and watch the thermal receipt adapt instantly!
          </p>
        </div>

        <div className="grid lg:grid-cols-12 gap-10 items-start">
          
          {/* Controls Form (5 cols) */}
          <div className="lg:col-span-5 bg-white rounded-3xl border-2 border-slate-200 p-6 sm:p-7 shadow-sm space-y-5">
            <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
              <Palette className="w-5 h-5 text-blue-600" />
              <span>Live Customizer Controls</span>
            </h3>

            {/* Template Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Active Format</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: "thermal_compact", label: "58mm Roll" },
                  { id: "thermal_standard", label: "80mm POS" },
                  { id: "gst_tax", label: "GST Tax" },
                  { id: "whatsapp", label: "WhatsApp" }
                ].map(t => (
                  <button
                    key={t.id}
                    onClick={() => setTemplate(t.id)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all text-center ${
                      template === t.id
                        ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Shop Name Input */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Shop / Store Name</label>
              <input
                type="text"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold focus:outline-none focus:border-blue-600"
              />
            </div>

            {/* Phone Input */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Phone Number on Receipt</label>
              <input
                type="text"
                value={shopPhone}
                onChange={(e) => setShopPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold focus:outline-none focus:border-blue-600"
              />
            </div>

            {/* GSTIN Input */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">GSTIN Number (Optional)</label>
              <input
                type="text"
                value={shopGst}
                onChange={(e) => setShopGst(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono focus:outline-none focus:border-blue-600"
              />
            </div>

            {/* Custom Terms Input */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Custom Return / Warranty Policy</label>
              <textarea
                rows={2}
                value={footerNote}
                onChange={(e) => setFooterNote(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:outline-none focus:border-blue-600"
              />
            </div>

            {/* Toggles */}
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 cursor-pointer text-xs font-bold text-slate-800">
                <span className="flex items-center gap-2">
                  <QrCode className="w-4 h-4 text-blue-600" /> Print UPI QR Code on Bill
                </span>
                <input 
                  type="checkbox" 
                  checked={showQr} 
                  onChange={(e) => setShowQr(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-0 w-4 h-4"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 cursor-pointer text-xs font-bold text-slate-800">
                <span className="flex items-center gap-2">
                  <Store className="w-4 h-4 text-blue-600" /> Print Cashier Name on Bill
                </span>
                <input 
                  type="checkbox" 
                  checked={showCashier} 
                  onChange={(e) => setShowCashier(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-0 w-4 h-4"
                />
              </label>
            </div>

          </div>

          {/* Real-time Receipt Preview Paper (7 cols) */}
          <div className="lg:col-span-7">
            <Card3D depth={14} glow={true} className="w-full">
              <div className="bg-white rounded-3xl border-2 border-slate-200 p-6 sm:p-8 shadow-xl">
                
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-5">
                  <div className="flex items-center gap-2">
                    <Printer className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-black uppercase tracking-wider text-slate-800">
                      Live Receipt Morphing Output
                    </span>
                  </div>
                  <span className="text-[10px] font-mono font-bold bg-blue-100 text-blue-800 px-2.5 py-1 rounded">
                    {template.toUpperCase()}
                  </span>
                </div>

                {/* Thermal Bill Container */}
                <div className="bg-[#FAF8F5] rounded-2xl p-6 border-2 border-dashed border-slate-300 font-mono text-xs text-slate-800 min-h-[420px] shadow-inner relative flex flex-col justify-between">
                  
                  <div>
                    {/* Header */}
                    <div className="text-center pb-3 border-b border-dashed border-slate-400">
                      <div className="font-black text-base sm:text-lg uppercase tracking-wide text-slate-950">
                        {shopName || "YOUR DUKAAN NAME"}
                      </div>
                      <div className="text-[11px] text-slate-600">Ph: {shopPhone}</div>
                      {shopGst && (
                        <div className="text-[10px] text-slate-500">GSTIN: {shopGst}</div>
                      )}
                    </div>

                    {/* Meta info */}
                    <div className="flex justify-between text-[11px] text-slate-600 py-2 border-b border-dashed border-slate-300">
                      <span>Inv: #INV-2041</span>
                      <span>08-Sep-2026 20:15</span>
                    </div>
                    {showCashier && (
                      <div className="flex justify-between text-[10px] text-slate-500 pb-2 border-b border-dashed border-slate-300">
                        <span>Cashier: Rahul (Register 1)</span>
                        <span>Mode: UPI</span>
                      </div>
                    )}

                    {/* Format 1: 58mm compact */}
                    {template === "thermal_compact" && (
                      <div className="py-2.5 space-y-1.5 border-b border-dashed border-slate-400 text-xs">
                        <div className="flex justify-between font-bold text-slate-900 border-b border-slate-200 pb-1">
                          <span>ITEM</span>
                          <span>QTY</span>
                          <span>PRICE</span>
                        </div>
                        <div className="flex justify-between">
                          <span>1. Amul Pure Ghee 1L</span>
                          <span>1</span>
                          <span>₹580.00</span>
                        </div>
                        <div className="flex justify-between">
                          <span>2. Tata Salt Lite 1kg</span>
                          <span>2</span>
                          <span>₹56.00</span>
                        </div>
                        <div className="flex justify-between">
                          <span>3. Fortune Sunlite 1L</span>
                          <span>1</span>
                          <span>₹145.00</span>
                        </div>
                      </div>
                    )}

                    {/* Format 2: 80mm standard */}
                    {template === "thermal_standard" && (
                      <div className="py-2.5 space-y-1.5 border-b border-dashed border-slate-400 text-xs">
                        <div className="grid grid-cols-12 font-bold text-slate-900 border-b border-slate-200 pb-1 text-[11px]">
                          <span className="col-span-6">ITEM DESCRIPTION</span>
                          <span className="col-span-2 text-center">QTY</span>
                          <span className="col-span-2 text-right">RATE</span>
                          <span className="col-span-2 text-right">TOTAL</span>
                        </div>
                        <div className="grid grid-cols-12 text-[11px]">
                          <span className="col-span-6">Amul Pure Ghee 1L</span>
                          <span className="col-span-2 text-center">1</span>
                          <span className="col-span-2 text-right">₹580</span>
                          <span className="col-span-2 text-right">₹580.00</span>
                        </div>
                        <div className="grid grid-cols-12 text-[11px]">
                          <span className="col-span-6">Tata Salt Lite 1kg</span>
                          <span className="col-span-2 text-center">2</span>
                          <span className="col-span-2 text-right">₹28</span>
                          <span className="col-span-2 text-right">₹56.00</span>
                        </div>
                        <div className="grid grid-cols-12 text-[11px]">
                          <span className="col-span-6">Fortune Sunlite 1L</span>
                          <span className="col-span-2 text-center">1</span>
                          <span className="col-span-2 text-right">₹145</span>
                          <span className="col-span-2 text-right">₹145.00</span>
                        </div>
                      </div>
                    )}

                    {/* Format 3: GST Tax */}
                    {template === "gst_tax" && (
                      <div className="py-2 border-b border-dashed border-slate-400 space-y-1 text-[10px]">
                        <div className="grid grid-cols-12 font-bold text-slate-900 border-b border-slate-300 pb-0.5">
                          <span className="col-span-5">DESC (HSN)</span>
                          <span className="col-span-2 text-center">TAXABLE</span>
                          <span className="col-span-2 text-center">GST%</span>
                          <span className="col-span-3 text-right">TOTAL</span>
                        </div>
                        <div className="grid grid-cols-12">
                          <span className="col-span-5">Ghee (0405)</span>
                          <span className="col-span-2 text-center">₹517.85</span>
                          <span className="col-span-2 text-center">12%</span>
                          <span className="col-span-3 text-right">₹580.00</span>
                        </div>
                        <div className="grid grid-cols-12">
                          <span className="col-span-5">Salt (2501)</span>
                          <span className="col-span-2 text-center">₹56.00</span>
                          <span className="col-span-2 text-center">0%</span>
                          <span className="col-span-3 text-right">₹56.00</span>
                        </div>
                        <div className="grid grid-cols-12">
                          <span className="col-span-5">Oil (1512)</span>
                          <span className="col-span-2 text-center">₹138.10</span>
                          <span className="col-span-2 text-center">5%</span>
                          <span className="col-span-3 text-right">₹145.00</span>
                        </div>
                      </div>
                    )}

                    {/* Format 4: WhatsApp Digital */}
                    {template === "whatsapp" && (
                      <div className="py-3 px-3.5 my-2 rounded-xl bg-white border border-emerald-300 space-y-2 text-xs">
                        <div className="flex items-center gap-2 text-emerald-800 font-bold">
                          <Share2 className="w-4 h-4" />
                          <span>WhatsApp Digital Cash Memo Dispatch</span>
                        </div>
                        <div className="text-[11px] text-slate-700 leading-relaxed font-sans">
                          🧾 <strong>{shopName}</strong> — Digital Receipt<br />
                          Total Items: 3 · Grand Total: <strong>₹781.00 (PAID via UPI)</strong><br />
                          Thank you for shopping with us!
                        </div>
                      </div>
                    )}

                    {/* Total */}
                    <div className="flex justify-between font-black text-base pt-2 text-slate-950">
                      <span>GRAND TOTAL:</span>
                      <span className="text-blue-700">₹781.00</span>
                    </div>

                    {/* Dynamic UPI QR Code Preview */}
                    {showQr && (
                      <div className="mt-4 p-3 rounded-xl bg-white border border-slate-200 flex items-center justify-center gap-3">
                        <div className="w-14 h-14 rounded-lg bg-slate-100 border border-slate-300 flex items-center justify-center">
                          <QrCode className="w-10 h-10 text-slate-800" />
                        </div>
                        <div className="text-left text-[10px] text-slate-600">
                          <strong className="block text-xs text-slate-900">Scan to Pay Exact Amount: ₹781</strong>
                          <span>Google Pay, PhonePe, Paytm, BHIM</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Footer Note */}
                  <div className="text-center pt-3 border-t border-dashed border-slate-400 text-[10px] text-slate-600 font-medium">
                    {footerNote}
                  </div>

                </div>

              </div>
            </Card3D>
          </div>

        </div>
      </section>

      {/* =========================================================
          SECTION 4: THEMES & VISUAL BRANDING
      ========================================================= */}
      <section className="py-20 bg-slate-50 border-t border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold uppercase tracking-wider mb-3">
              <Palette className="w-3.5 h-3.5 text-blue-600" />
              <span>Store Visual Themes</span>
            </div>
            <h2 className="font-sans font-black text-3xl sm:text-4xl text-slate-900 tracking-tight">
              5 Handcrafted Brand Themes
            </h2>
            <p className="mt-2 text-slate-600 text-sm">
              Change the look and feel of your entire counter billing dashboard to match your shop's personality.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                id: "terracotta",
                name: "Mitti Terracotta",
                desc: "Classic warm Indian clay aesthetic. Evokes traditional trust and warm Kirana hospitality.",
                color: "bg-[#D4623B]"
              },
              {
                id: "purple",
                name: "Dukaan Pro Purple",
                desc: "Signature luxury royal purple and slate theme for modern boutiques and supermarkets.",
                color: "bg-purple-600"
              },
              {
                id: "indigo",
                name: "Royal Indigo",
                desc: "Professional deep corporate blue for electronics, pharmacies, and wholesale provisions.",
                color: "bg-[#0066FF]"
              },
              {
                id: "emerald",
                name: "Fresh Emerald",
                desc: "Organic green for fruit, vegetable, dairy, and grocery stores.",
                color: "bg-emerald-600"
              },
              {
                id: "midnight",
                name: "Midnight Counter",
                desc: "High-contrast dark mode for low-light evening billing counters without eye strain.",
                color: "bg-slate-900"
              }
            ].map((thm, i) => (
              <div 
                key={i} 
                onClick={() => setActiveTheme(thm.id)}
                className={`p-6 rounded-3xl border-2 transition-all cursor-pointer bg-white ${
                  activeTheme === thm.id
                    ? "border-blue-600 shadow-md ring-2 ring-blue-500/20"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-8 h-8 rounded-full ${thm.color} shadow-sm`} />
                  <h3 className="font-bold text-base text-slate-900">{thm.name}</h3>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed font-normal">{thm.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================
          SECTION 5: VIRTUAL SOUNDBOX AUDIO STUDIO
      ========================================================= */}
      <section className="py-20 max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          
          <div className="lg:col-span-6 space-y-5">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold uppercase tracking-wider">
              <Volume2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Audio Customizer</span>
            </div>

            <h2 className="font-sans font-black text-3xl sm:text-4xl text-slate-900 tracking-tight leading-tight">
              Virtual Voice Soundbox Studio. <br />
              <span className="text-emerald-600">Zero Hardware Rental.</span>
            </h2>

            <p className="text-base text-slate-600 leading-relaxed font-normal">
              Customize voice alerts for every UPI transaction. Choose the language your counter staff understands best, test frequencies, and avoid paying ₹1,800 every year to external speaker box companies.
            </p>

            <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-3">
              <span className="text-xs font-extrabold text-emerald-950 uppercase tracking-wider block">
                🎧 Click Any Language to Test Voice Right Now:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { id: "hi", name: "Hindi (हिंदी)" },
                  { id: "gu", name: "Gujarati (ગુજરાતી)" },
                  { id: "en", name: "English" },
                  { id: "mr", name: "Marathi (मराठी)" },
                  { id: "ta", name: "Tamil (தமிழ்)" }
                ].map(l => (
                  <button
                    key={l.id}
                    onClick={() => handleTestSoundbox(l.id)}
                    disabled={isPlayingSoundbox}
                    className="px-3 py-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 bg-white text-emerald-900 border-emerald-200 hover:bg-emerald-100/70 active:scale-95 shadow-xs"
                  >
                    <Volume2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{l.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-6">
            <Card3D depth={14} glow={true} className="w-full">
              <div className="bg-white rounded-3xl border-2 border-slate-200 p-6 sm:p-8 shadow-xl space-y-5">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200">
                  <Volume2 className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-lg text-slate-900">Audio Customization Superpowers</h3>
                <ul className="space-y-3 text-xs text-slate-600">
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>5 Indian Languages:</strong> Hindi, Gujarati, Marathi, Tamil, English.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Instant Chime Bell:</strong> Distinct dual pleasant chime (D5-A5) before speaking.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Zero Hardware Cost:</strong> Plays through any computer or laptop speaker automatically.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Fraud Prevention:</strong> Cashier hears the announcement immediately without checking mobile screen.</span>
                  </li>
                </ul>
              </div>
            </Card3D>
          </div>

        </div>
      </section>

      {/* =========================================================
          SECTION 6: HOW MERCHANTS ACCESS & USE PRO STUDIO
      ========================================================= */}
      <section className="py-20 bg-slate-50 border-t border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="font-sans font-black text-3xl sm:text-4xl text-slate-900 tracking-tight">
              How to Start Using Pro Studio in 4 Easy Steps
            </h2>
            <p className="mt-2 text-slate-600 text-sm">
              Get up and running in under 60 seconds with zero technical setup.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                step: "01",
                title: "Upgrade to Pro",
                desc: "Subscribe to the Dukaan Pro Plan (₹499/mo) with 1+1 Month Free launch offer."
              },
              {
                step: "02",
                title: "Open App Settings",
                desc: "Go to Settings inside your Dukaan counter app and click on 'Dukaan Pro Studio'."
              },
              {
                step: "03",
                title: "Customize Everything",
                desc: "Choose your receipt roll width, upload your shop logo, set return terms, and enable UPI QR."
              },
              {
                step: "04",
                title: "Instant Cloud Sync",
                desc: "Click Save — all your billing receipts, invoices, and counter themes update instantly!"
              }
            ].map((st, i) => (
              <div key={i} className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs">
                <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white font-black text-lg flex items-center justify-center mb-4 shadow-md shadow-blue-500/20">
                  {st.step}
                </div>
                <h3 className="font-bold text-base text-slate-900 mb-1.5">{st.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed font-normal">{st.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================
          HIGH-IMPACT UNLOCK PRO STUDIO BANNER
      ========================================================= */}
      <section className="py-20 max-w-5xl mx-auto px-4 sm:px-6 text-center">
        <div className="rounded-[40px] bg-gradient-to-b from-[#0052FF] via-[#0042D9] to-[#0A1B6B] p-8 sm:p-14 text-white shadow-2xl relative overflow-hidden">
          
          <div className="w-16 h-16 rounded-3xl bg-white/15 border border-white/30 backdrop-blur-md text-amber-300 flex items-center justify-center mx-auto mb-5 shadow-inner">
            <Crown className="w-9 h-9 fill-amber-300/30 text-amber-300" />
          </div>

          <h2 className="font-sans font-black text-3xl sm:text-5xl tracking-tight text-white">
            Unlock Dukaan Pro Studio Today.
          </h2>

          <p className="text-blue-100 text-base sm:text-lg mt-4 max-w-xl mx-auto leading-relaxed font-normal">
            Dukaan Pro Studio is included <strong>100% free with the Dukaan Pro Plan (₹499/mo)</strong>. 
            Enjoy 1+1 Month Free launch promotion, zero setup fee, and instant activation!
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/subscribe?plan=pro"
              className="w-full sm:w-auto h-14 px-9 rounded-full bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-base shadow-xl shadow-amber-400/25 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <span>Unlock Dukaan Pro Studio (₹499/mo)</span>
              <ArrowRight className="w-5 h-5 text-slate-950" />
            </Link>

            <Link
              to="/pro-plan"
              className="w-full sm:w-auto h-14 px-8 rounded-full bg-white hover:bg-slate-100 text-blue-900 font-extrabold text-base shadow-md transition-all flex items-center justify-center gap-2"
            >
              <span>Explore Dukaan Pro Plan</span>
              <ArrowRight className="w-4 h-4" />
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
          <span className="font-bold text-slate-800 text-sm">Kivo Pro Studio</span>
        </div>
        <p className="mb-4">Business Made Simple. A Product by PEAN.</p>
        <div className="flex justify-center gap-6 text-slate-600 font-medium">
          <Link to="/" className="hover:text-blue-600">Home</Link>
          <Link to="/pro-plan" className="hover:text-blue-600">Kivo Pro Plan</Link>
          <Link to="/subscribe" className="hover:text-blue-600">Pricing</Link>
          <Link to="/careers" className="hover:text-blue-600">Careers</Link>
          <Link to="/privacy-policy" className="hover:text-blue-600">Privacy Policy</Link>
        </div>
      </footer>

    </div>
  );
}
