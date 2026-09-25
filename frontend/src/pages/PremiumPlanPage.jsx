import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  Building2, 
  Store, 
  FileText, 
  ShieldCheck, 
  ArrowRight, 
  Check, 
  Sparkles, 
  HelpCircle, 
  ChevronRight, 
  CheckCircle2, 
  Clock, 
  Sliders, 
  Crown,
  Share2,
  TrendingUp,
  Receipt,
  Download,
  Percent,
  CheckCheck,
  Headphones,
  Users2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import Card3D from "@/components/Card3D";

const BRANCHES = [
  {
    id: "hq",
    name: "👑 HQ Consolidated (All 3 Shops)",
    location: "Owner Central Command",
    todaySales: "₹1,10,250",
    billCount: 354,
    margin: "18.4%",
    status: "All 3 Online & Synced",
    topProduct: "Basmati Rice 5kg (78 units)"
  },
  {
    id: "b1",
    name: "Branch 1: Station Road",
    location: "Station Road, Counter A",
    todaySales: "₹42,500",
    billCount: 142,
    margin: "19.2%",
    status: "Active (2 cashiers)",
    topProduct: "Fortune Oil 1L"
  },
  {
    id: "b2",
    name: "Branch 2: Main Bazaar",
    location: "Main Market, Clock Tower",
    todaySales: "₹38,150",
    billCount: 118,
    margin: "17.8%",
    status: "Active (1 cashier)",
    topProduct: "Amul Ghee 1L"
  },
  {
    id: "b3",
    name: "Branch 3: Sector 4",
    location: "Residential Complex Gate 2",
    todaySales: "₹29,600",
    billCount: 94,
    margin: "18.1%",
    status: "Active (1 cashier)",
    topProduct: "Aashirvaad Atta 10kg"
  }
];

export default function PremiumPlanPage() {
  const nav = useNavigate();
  
  // Interactive HQ State
  const [selectedBranch, setSelectedBranch] = useState(BRANCHES[0]);
  const [showTaxAudit, setShowTaxAudit] = useState(false);

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

            <span className="hidden md:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs font-bold">
              <Building2 className="w-3.5 h-3.5 text-indigo-600" />
              <span>Kivo Premium Plan</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link 
              to="/pro-plan"
              className="text-xs sm:text-sm font-bold text-slate-700 hover:text-blue-600 flex items-center gap-1.5 transition-colors px-3 py-2 rounded-xl hover:bg-slate-100"
            >
              <Crown className="w-4 h-4 text-blue-600" />
              <span>Explore Kivo Pro</span>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </Link>

            <Link 
              to="/subscribe?plan=premium"
              className="px-5 sm:px-6 h-10 sm:h-11 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm active:scale-95 transition-all shadow-md shadow-indigo-600/20 flex items-center gap-2"
            >
              <span>Get Premium (₹239/mo)</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

        </div>
      </header>

      {/* =========================================================
          HERO SECTION: DUKAAN PREMIUM PLAN
      ========================================================= */}
      <section className="relative overflow-hidden pt-12 sm:pt-20 pb-16 lg:pb-24 border-b border-slate-200 bg-gradient-to-b from-indigo-50/40 via-white to-white">
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-r from-indigo-400/15 via-blue-400/10 to-purple-400/15 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center relative z-10">
          
          {/* Official Kivo Premium Brand Logo */}
          <div className="mb-4 inline-flex items-center gap-2 bg-slate-950 px-4 py-2 rounded-2xl border border-slate-800 shadow-md">
            <img src="/kivo-premium.png" alt="Kivo Premium" className="h-8 sm:h-10 w-auto object-contain" />
          </div>

          <div className="block">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs font-black uppercase tracking-widest mb-6 shadow-2xs">
              <Building2 className="w-4 h-4 text-indigo-600" />
              <span>For Multi-Shop Owners & GST Registered Retailers</span>
            </div>
          </div>

          <h1 className="font-sans font-black text-4xl sm:text-6xl lg:text-7xl tracking-[-0.03em] leading-[1.05] text-slate-950 max-w-4xl mx-auto">
            Manage Multiple Branches & <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-blue-700 to-indigo-900">
              Tax Audits with Ease.
            </span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-600 font-normal max-w-2xl mx-auto leading-relaxed">
            Engineered for growing supermarket and Kirana chains with up to 3 branch stores. 
            Consolidate multi-shop revenue, generate 1-click GSTR-1/3B tax audit reports for your CA, and get priority WhatsApp support for just <strong>₹239/month</strong>.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              to="/subscribe?plan=premium"
              className="w-full sm:w-auto h-14 px-9 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-base active:scale-95 transition-all shadow-xl shadow-indigo-600/25 flex items-center justify-center gap-2.5"
            >
              <Building2 className="w-5 h-5 text-indigo-200" />
              <span>Get Premium Plan — ₹239/month</span>
              <ArrowRight className="w-5 h-5" />
            </Link>

            <Link 
              to="/pro-plan"
              className="w-full sm:w-auto h-14 px-8 rounded-full bg-white hover:bg-slate-50 border-2 border-slate-200 hover:border-indigo-600 text-slate-800 hover:text-indigo-700 font-bold text-base active:scale-95 transition-all shadow-xs flex items-center justify-center gap-2"
            >
              <span>Need Cashier PIN & Pro Studio? Explore Pro →</span>
            </Link>
          </div>

          {/* Value Highlights */}
          <div className="mt-10 flex items-center justify-center gap-6 sm:gap-10 text-xs font-semibold text-slate-600 flex-wrap">
            <span className="flex items-center gap-1.5 text-slate-800">
              <CheckCircle2 className="w-4 h-4 text-indigo-600" /> Multi-Shop HQ (Up to 3 Branches)
            </span>
            <span className="flex items-center gap-1.5 text-slate-800">
              <CheckCircle2 className="w-4 h-4 text-indigo-600" /> Full FY CA Tax & Profit Audit
            </span>
            <span className="flex items-center gap-1.5 text-slate-800">
              <CheckCircle2 className="w-4 h-4 text-indigo-600" /> Official GST Invoicing (A4/A5)
            </span>
          </div>

        </div>
      </section>

      {/* =========================================================
          INTERACTIVE MULTI-SHOP HQ SWITCHER & AUDIT SIMULATOR
      ========================================================= */}
      <section className="py-20 max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs font-bold uppercase tracking-wider mb-3">
            <Building2 className="w-3.5 h-3.5 text-indigo-600" /> Live Multi-Shop Sandbox
          </div>
          <h2 className="font-sans font-black text-3xl sm:text-4xl text-slate-900 tracking-tight">
            Switch Branches in Real-Time
          </h2>
          <p className="mt-3 text-slate-600 text-sm sm:text-base">
            Click between branches below to see how store owners monitor multiple locations from a single dashboard.
          </p>
        </div>

        <div className="grid lg:grid-cols-12 gap-8 items-start">
          
          {/* Left: Branch Switcher Selector (5 cols) */}
          <div className="lg:col-span-5 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <span className="text-xs font-black text-slate-500 uppercase tracking-wider">Your Retail Branches</span>
              <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full">
                3 of 3 Active
              </span>
            </div>

            {BRANCHES.map((b) => {
              const isSelected = selectedBranch.id === b.id;
              return (
                <div
                  key={b.id}
                  onClick={() => setSelectedBranch(b)}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                    isSelected 
                      ? "bg-indigo-50/70 border-indigo-600 shadow-sm" 
                      : "bg-white border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">{b.name}</h4>
                    <span className="text-xs text-slate-500">{b.location}</span>
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full block w-fit mt-1">
                      {b.status}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-xs text-slate-400 font-medium block">Today</span>
                    <span className="text-base font-black text-slate-950">{b.todaySales}</span>
                  </div>
                </div>
              );
            })}

            <div className="pt-2">
              <Button
                onClick={() => setShowTaxAudit(!showTaxAudit)}
                className="w-full h-12 rounded-2xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-900 font-extrabold text-xs active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <FileText className="w-4 h-4 text-indigo-600" />
                <span>{showTaxAudit ? "Hide CA Tax Audit Preview" : "View FY CA Tax Audit Ledger Preview"}</span>
              </Button>
            </div>
          </div>

          {/* Right: Real-Time Branch Performance Card (7 cols) */}
          <div className="lg:col-span-7">
            <Card3D depth={15} glow={true} className="w-full">
              <div className="rounded-3xl bg-white border-2 border-slate-300 p-6 shadow-xl space-y-5">
                
                {/* Branch Header */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                  <div>
                    <span className="text-xs font-mono text-slate-400 uppercase tracking-widest">Selected View</span>
                    <h3 className="font-black text-lg text-slate-900">{selectedBranch.name}</h3>
                  </div>
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-indigo-100 text-indigo-800">
                    Cloud Synced
                  </span>
                </div>

                {/* 3 Metric Stats */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                    <span className="text-[11px] font-medium text-slate-500 block">Total Revenue</span>
                    <span className="text-lg font-black text-slate-900">{selectedBranch.todaySales}</span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                    <span className="text-[11px] font-medium text-slate-500 block">Invoices Cleared</span>
                    <span className="text-lg font-black text-slate-900">{selectedBranch.billCount} bills</span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                    <span className="text-[11px] font-medium text-slate-500 block">Gross Margin</span>
                    <span className="text-lg font-black text-emerald-700">{selectedBranch.margin}</span>
                  </div>
                </div>

                {/* Fast mover */}
                <div className="p-3.5 rounded-2xl bg-indigo-50/50 border border-indigo-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-indigo-600" />
                    <span className="text-slate-700">Top Performing SKU Today:</span>
                  </div>
                  <span className="font-bold text-slate-900">{selectedBranch.topProduct}</span>
                </div>

                {/* Tax Audit Pack Drawer Simulation */}
                {showTaxAudit && (
                  <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-3 animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-amber-400" />
                        <span className="font-mono text-xs font-bold text-amber-300">CA AUDIT PACK (GSTR-1 / 3B)</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">FY 2024-25 Ready</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] font-mono border-y border-slate-800 py-2">
                      <div>
                        <span className="text-slate-400 block">Taxable Sales:</span>
                        <span className="font-bold text-white">₹12,45,800.00</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Total CGST + SGST:</span>
                        <span className="font-bold text-emerald-400">₹1,12,122.00</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] text-slate-400">Export ready for Tally / Busy / Excel</span>
                      <Button className="h-8 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs">
                        <Download className="w-3.5 h-3.5 mr-1" />
                        Download CSV
                      </Button>
                    </div>
                  </div>
                )}

              </div>
            </Card3D>
          </div>

        </div>
      </section>

      {/* =========================================================
          5 PILLARS OF DUKAAN PREMIUM PLAN
      ========================================================= */}
      <section className="py-20 bg-slate-50 border-t border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="font-sans font-black text-3xl sm:text-4xl text-slate-900 tracking-tight">
              Enterprise Features Built for Growth
            </h2>
            <p className="mt-3 text-slate-600 text-base">
              Everything in Starter and Business, tailored for multi-shop operations and formal tax compliance.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Store,
                title: "Multi-Shop Headquarter (HQ)",
                desc: "Monitor up to 3 physical shop branches from a single login. View real-time comparative sales and transfer stock between branches."
              },
              {
                icon: FileText,
                title: "Full FY Tax & Profit Audit",
                desc: "One-click GSTR-1, GSTR-3B tax summaries, HSN code sales ledger, and complete balance sheet audit export ready for your CA."
              },
              {
                icon: Receipt,
                title: "Official GST Tax Invoices",
                desc: "Generate professional A4 and A5 Tax Invoices with verified GSTIN, state jurisdiction codes, CGST/SGST ledger, and digital signatures."
              },
              {
                icon: Headphones,
                title: "Priority WhatsApp Support",
                desc: "Skip the standard queue with direct access to Dukaan's senior engineering team via priority WhatsApp helpline with <15 min SLA."
              },
              {
                icon: Users2,
                title: "Branch-Wise Staff Roles",
                desc: "Assign branch managers to specific shops so they only see their local store counter without viewing overall business profits."
              },
              {
                icon: ShieldCheck,
                title: "Automated Cloud Backups",
                desc: "Triple-redundant encrypted cloud storage ensures your corporate tax records and sales receipts remain tamper-proof."
              }
            ].map((pillar, i) => {
              const Icon = pillar.icon;
              return (
                <div key={i} className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs hover:border-indigo-400 hover:shadow-md transition-all">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4 border border-indigo-100">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-base text-slate-900 mb-2">{pillar.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed font-normal">{pillar.desc}</p>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* =========================================================
          FULL 4-PLAN COMPARISON TABLE (PREMIUM HIGHLIGHTED)
      ========================================================= */}
      <section className="py-20 max-w-5xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold uppercase tracking-wider mb-3">
            Plan Comparison
          </div>
          <h2 className="font-sans font-black text-3xl sm:text-4xl text-slate-900 tracking-tight">
            How Premium Compares
          </h2>
          <p className="mt-2 text-slate-600 text-sm">
            Everything your multi-branch enterprise needs at ₹239/month.
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80">
                  <th className="py-4 px-4 sm:px-6 font-bold text-slate-700">Feature</th>
                  <th className="py-4 px-3 sm:px-4 font-bold text-slate-800">Starter (₹79/mo)</th>
                  <th className="py-4 px-3 sm:px-4 font-bold text-slate-800">Business (₹119/mo)</th>
                  <th className="py-4 px-3 sm:px-4 font-black text-indigo-700 bg-indigo-50/50">
                    Premium (₹239/mo) ★
                  </th>
                  <th className="py-4 px-3 sm:px-4 font-black text-blue-700">Dukaan Pro (₹499/mo)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                <tr>
                  <td className="py-3.5 px-4 sm:px-6 font-semibold text-slate-900">Multi-Shop HQ Support</td>
                  <td className="py-3.5 px-3 sm:px-4 text-slate-400">1 Counter</td>
                  <td className="py-3.5 px-3 sm:px-4 text-slate-600">1 Shop</td>
                  <td className="py-3.5 px-3 sm:px-4 text-indigo-700 font-bold bg-indigo-50/30">Up to 3 Branches</td>
                  <td className="py-3.5 px-3 sm:px-4 font-semibold text-blue-700">Unlimited Branches</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 sm:px-6 font-semibold text-slate-900">FY Financial Year Tax Audit</td>
                  <td className="py-3.5 px-3 sm:px-4 text-slate-400">—</td>
                  <td className="py-3.5 px-3 sm:px-4 text-slate-400">—</td>
                  <td className="py-3.5 px-3 sm:px-4 text-indigo-700 font-bold bg-indigo-50/30">Full GSTR Audit Pack</td>
                  <td className="py-3.5 px-3 sm:px-4 font-semibold text-blue-700">Full Audit + Export</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 sm:px-6 font-semibold text-slate-900">Official GST Invoicing (A4/A5)</td>
                  <td className="py-3.5 px-3 sm:px-4 text-slate-400">—</td>
                  <td className="py-3.5 px-3 sm:px-4 text-slate-400">—</td>
                  <td className="py-3.5 px-3 sm:px-4 text-indigo-700 font-bold bg-indigo-50/30">Included</td>
                  <td className="py-3.5 px-3 sm:px-4 font-semibold text-blue-700">Included</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 sm:px-6 font-semibold text-slate-900">Support Priority</td>
                  <td className="py-3.5 px-3 sm:px-4 text-slate-500">Standard Email</td>
                  <td className="py-3.5 px-3 sm:px-4 text-slate-600">WhatsApp Support</td>
                  <td className="py-3.5 px-3 sm:px-4 text-indigo-700 font-bold bg-indigo-50/30">Priority WhatsApp (&lt;15m)</td>
                  <td className="py-3.5 px-3 sm:px-4 font-semibold text-blue-700">24/7 Dedicated VIP</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 sm:px-6 font-semibold text-slate-900">Cashier PIN Security</td>
                  <td className="py-3.5 px-3 sm:px-4 text-slate-400">—</td>
                  <td className="py-3.5 px-3 sm:px-4 text-slate-400">—</td>
                  <td className="py-3.5 px-3 sm:px-4 text-slate-400 bg-indigo-50/30">—</td>
                  <td className="py-3.5 px-3 sm:px-4 font-semibold text-blue-700">4-Digit Master PIN</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 sm:px-6 font-semibold text-slate-900">Dukaan Pro Studio Access</td>
                  <td className="py-3.5 px-3 sm:px-4 text-slate-400">—</td>
                  <td className="py-3.5 px-3 sm:px-4 text-slate-400">—</td>
                  <td className="py-3.5 px-3 sm:px-4 text-slate-400 bg-indigo-50/30">—</td>
                  <td className="py-3.5 px-3 sm:px-4 font-semibold text-blue-700">Full Studio Suite</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* =========================================================
          FAQS FOR PREMIUM MERCHANTS
      ========================================================= */}
      <section className="py-20 max-w-4xl mx-auto px-4 sm:px-6 border-t border-slate-200">
        <div className="text-center mb-12">
          <h2 className="font-sans font-black text-3xl text-slate-900 tracking-tight">Premium Plan FAQs</h2>
          <p className="mt-2 text-slate-600 text-sm">Common questions regarding multi-shop management and GST audits.</p>
        </div>

        <Accordion type="single" collapsible className="space-y-4">
          <AccordionItem value="faq-1" className="bg-white rounded-2xl border border-slate-200 px-6">
            <AccordionTrigger className="font-bold text-slate-900 hover:no-underline text-left">
              How does Multi-Shop HQ sync work across branches?
            </AccordionTrigger>
            <AccordionContent className="text-slate-600 text-sm leading-relaxed">
              Each branch logs into their own counter instance. As soon as a bill is generated or stock is sold at Branch 1 or Branch 2, your master owner account sees the updated numbers in real-time.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="faq-2" className="bg-white rounded-2xl border border-slate-200 px-6">
            <AccordionTrigger className="font-bold text-slate-900 hover:no-underline text-left">
              Can I send the GSTR report directly to my Chartered Accountant?
            </AccordionTrigger>
            <AccordionContent className="text-slate-600 text-sm leading-relaxed">
              Yes! The export files are standard Excel / CSV spreadsheets mapped to the exact GST government portal fields (HSN summary, taxable values, CGST/SGST/IGST breakdown) for zero-effort filing.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="faq-3" className="bg-white rounded-2xl border border-slate-200 px-6">
            <AccordionTrigger className="font-bold text-slate-900 hover:no-underline text-left">
              What if I need more than 3 branches in the future?
            </AccordionTrigger>
            <AccordionContent className="text-slate-600 text-sm leading-relaxed">
              If you grow beyond 3 branches, you can upgrade to Dukaan Pro or contact our enterprise team to add unlimited branches seamlessly.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </section>

      {/* =========================================================
          HIGH-IMPACT UPGRADE BANNER
      ========================================================= */}
      <section className="py-20 max-w-5xl mx-auto px-4 sm:px-6 text-center">
        <div className="rounded-[40px] bg-gradient-to-b from-indigo-600 via-indigo-700 to-slate-950 p-8 sm:p-14 text-white shadow-2xl relative overflow-hidden">
          
          <div className="w-16 h-16 rounded-3xl bg-white/15 border border-white/30 backdrop-blur-md text-amber-300 flex items-center justify-center mx-auto mb-5 shadow-inner">
            <Building2 className="w-9 h-9 fill-amber-300 text-amber-300" />
          </div>

          <h2 className="font-sans font-black text-3xl sm:text-5xl tracking-tight text-white">
            Scale Your Multi-Branch Enterprise.
          </h2>

          <p className="text-indigo-100 text-base sm:text-lg mt-4 max-w-xl mx-auto leading-relaxed font-normal">
            Take control of up to 3 shop branches, simplify Chartered Accountant tax filings, and get priority support for ₹239/month.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/subscribe?plan=premium"
              className="w-full sm:w-auto h-14 px-9 rounded-full bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-base shadow-xl shadow-amber-400/25 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <span>Get Premium Plan (₹239/mo)</span>
              <ArrowRight className="w-5 h-5 text-slate-950" />
            </Link>

            <Link
              to="/pro-plan"
              className="w-full sm:w-auto h-14 px-8 rounded-full bg-white hover:bg-slate-100 text-slate-900 font-extrabold text-base shadow-md transition-all flex items-center justify-center gap-2"
            >
              <span>Explore Kivo Pro Plan</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

        </div>
      </section>

    </div>
  );
}
