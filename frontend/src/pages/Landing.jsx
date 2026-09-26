import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Check,
  ChevronRight,
  Keyboard,
  MessageCircle,
  Package,
  Printer,
  ShieldCheck,
  Sparkles,
  Store,
  TrendingUp,
  Zap,
} from "lucide-react";
import { useAuth } from "@/lib/AuthContext";

const ecosystem = [
  { src: "/kivo-pro.png", alt: "Kivo Pro", href: "/pro-plan", label: "Pro" },
  { src: "/kivo-premium.png", alt: "Kivo Premium", href: "/premium-plan", label: "Premium" },
  { src: "/kivo-cafe.png", alt: "Kivo Cafe Plan", href: "/subscribe?plan=cafe", label: "Cafe" },
  { src: "/kivo-pro-studio.png", alt: "Kivo Pro Studio", href: "/pro-studio", label: "Pro Studio" },
  { src: "/kivo-ai.png", alt: "Kivo AI", href: "/pro-studio", label: "AI" },
  { src: "/kivo-grid.png", alt: "Kivo Grid", href: "/app", label: "Grid" },
  { src: "/kivo-admin.png", alt: "Kivo Admin", href: "/admin", label: "Admin" },
];

const plans = {
  monthly: [
    {
      name: "Starter",
      price: "79",
      suffix: "/mo",
      description: "Everything a single counter needs to bill and manage stock.",
      features: ["Fast POS Billing Engine", "Unlimited Products & Inventory", "Basic Order History"],
      href: "/subscribe?plan=starter",
      featured: false,
      cta: "Choose Starter",
    },
    {
      name: "Business",
      price: "119",
      suffix: "/mo",
      description: "The complete daily workflow for growing retail counters.",
      features: ["All Starter features", "58mm / 80mm Thermal Receipts", "WhatsApp Udhaar Khata Reminders", "Daily Profit & Expense Analytics"],
      href: "/subscribe?plan=business",
      featured: true,
      cta: "Start Business",
    },
    {
      name: "Annual VIP",
      price: "1,499",
      suffix: "/yr",
      description: "Full-year access with priority support and premium billing tools.",
      features: ["Complete 12-Month Access", "Custom Shop Name & Logo on Bill", "Priority WhatsApp Onboarding"],
      href: "/subscribe?plan=premium",
      featured: false,
      cta: "Choose Annual VIP",
    },
  ],
  annual: [
    {
      name: "Starter",
      price: "799",
      suffix: "/yr",
      description: "Everything a single counter needs to bill and manage stock.",
      features: ["Fast POS Billing Engine", "Unlimited Products & Inventory", "Basic Order History"],
      href: "/subscribe?plan=starter",
      featured: false,
      cta: "Choose Starter",
    },
    {
      name: "Business",
      price: "1,199",
      suffix: "/yr",
      description: "The complete daily workflow for growing retail counters.",
      features: ["All Starter features", "58mm / 80mm Thermal Receipts", "WhatsApp Udhaar Khata Reminders", "Daily Profit & Expense Analytics"],
      href: "/subscribe?plan=business",
      featured: true,
      cta: "Start Business",
    },
    {
      name: "Annual VIP",
      price: "1,499",
      suffix: "/yr",
      description: "Full-year access with priority support and premium billing tools.",
      features: ["Complete 12-Month Access", "Custom Shop Name & Logo on Bill", "Priority WhatsApp Onboarding"],
      href: "/subscribe?plan=premium",
      featured: false,
      cta: "Choose Annual VIP",
    },
  ],
};

function FadeIn({ children, delay = 0, className = "" }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default function Landing() {
  const { user } = useAuth();
  const [billingCycle, setBillingCycle] = useState("monthly");

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f7f8fa] text-slate-950 selection:bg-blue-600/15 selection:text-blue-700">
      {/* Ambient background */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -top-56 left-1/2 h-[620px] w-[900px] -translate-x-1/2 rounded-full bg-blue-500/[0.08] blur-[130px]" />
        <div className="absolute right-[-12%] top-[38%] h-[520px] w-[520px] rounded-full bg-indigo-500/[0.06] blur-[130px]" />
        <div className="absolute bottom-[-10%] left-[-12%] h-[500px] w-[500px] rounded-full bg-sky-400/[0.06] blur-[130px]" />
      </div>

      {/* Header */}
      <header className="sticky top-3 z-50 px-3 sm:px-5">
        <nav className="mx-auto flex h-14 max-w-6xl items-center justify-between rounded-2xl border border-slate-200/80 bg-white/80 px-3 shadow-[0_12px_40px_rgba(15,23,42,0.08)] backdrop-blur-2xl sm:h-16 sm:rounded-full sm:px-5">
          <Link to="/" className="flex items-center gap-2.5">
            <img src="/kivo-logo.png" alt="Kivo" className="h-7 w-auto sm:h-8" />
            <span className="hidden rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.16em] text-slate-500 sm:inline-flex">
              Retail OS
            </span>
          </Link>

          <div className="hidden items-center gap-8 text-[12px] font-semibold text-slate-500 md:flex">
            <button onClick={() => scrollTo("features")} className="transition hover:text-slate-950">Features</button>
            <button onClick={() => scrollTo("ecosystem")} className="transition hover:text-slate-950">Ecosystem</button>
            <button onClick={() => scrollTo("pricing")} className="transition hover:text-slate-950">Pricing</button>
          </div>

          <div className="flex items-center gap-2">
            {!user && (
              <Link to="/login" className="hidden px-3 py-2 text-xs font-semibold text-slate-600 transition hover:text-slate-950 sm:block">
                Sign in
              </Link>
            )}
            <Link
              to={user ? "/app/pos" : "/register"}
              className="inline-flex h-9 items-center gap-1.5 rounded-full bg-slate-950 px-4 text-[11px] font-bold text-white shadow-lg shadow-slate-950/15 transition hover:-translate-y-0.5 hover:bg-blue-600 sm:h-10 sm:px-5"
            >
              {user ? "Launch POS" : "Get started"}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </nav>
      </header>

      <main className="relative z-10">
        {/* Hero */}
        <section className="mx-auto max-w-6xl px-4 pb-20 pt-20 text-center sm:px-6 sm:pt-28 lg:pb-28">
          <FadeIn>
            <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50/80 px-3.5 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-blue-700">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-600" />
              Kivo Retail OS
              <span className="text-blue-300">•</span>
              Built for the counter
            </div>
          </FadeIn>

          <FadeIn delay={0.06}>
            <h1 className="mx-auto mt-7 max-w-5xl text-5xl font-black tracking-[-0.055em] text-slate-950 sm:text-6xl lg:text-8xl lg:leading-[0.98]">
              Your shop.
              <br />
              <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 bg-clip-text text-transparent">
                Simplified.
              </span>
            </h1>
          </FadeIn>

          <FadeIn delay={0.12}>
            <p className="mx-auto mt-7 max-w-2xl text-sm leading-7 text-slate-500 sm:text-base">
              Fast billing, inventory, customers, Udhaar and reports — in one clean workspace built for modern Indian retailers.
            </p>
          </FadeIn>

          <FadeIn delay={0.18}>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                to="/register"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-blue-600 px-7 text-sm font-bold text-white shadow-xl shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-700"
              >
                Start free
                <ArrowRight className="h-4 w-4" />
              </Link>
              <button
                onClick={() => scrollTo("pricing")}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-7 text-sm font-bold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50"
              >
                View pricing
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </FadeIn>

          <FadeIn delay={0.24}>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[10px] font-semibold text-slate-400">
              {["Quick setup", "Thermal printing", "Inventory control", "Udhaar management"].map((item) => (
                <span key={item} className="inline-flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                  {item}
                </span>
              ))}
            </div>
          </FadeIn>

          {/* Product preview */}
          <FadeIn delay={0.3} className="mt-14 sm:mt-20">
            <div className="relative mx-auto max-w-5xl rounded-[28px] border border-slate-200 bg-slate-950 p-2 shadow-[0_35px_100px_rgba(15,23,42,0.20)] sm:rounded-[34px] sm:p-3">
              <div className="overflow-hidden rounded-[22px] border border-white/10 bg-[#f8fafc] sm:rounded-[27px]">
                <div className="flex h-11 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                    <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                    <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                    <span className="ml-3 hidden text-[9px] font-bold uppercase tracking-widest text-slate-400 sm:inline">Kivo POS</span>
                  </div>
                  <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[9px] font-bold text-emerald-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    LIVE
                  </div>
                </div>

                <div className="grid gap-3 p-3 text-left sm:grid-cols-[1.45fr_0.55fr] sm:p-5">
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="mb-4 flex items-center justify-between">
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-400">New bill</p>
                        <p className="mt-1 text-sm font-black text-slate-900">Counter #01</p>
                      </div>
                      <div className="rounded-lg bg-slate-100 px-2.5 py-1.5 font-mono text-[9px] font-bold text-slate-500">F6 • BILL</div>
                    </div>

                    <div className="space-y-2">
                      {[
                        ["Amul Butter", "1 × ₹275", "₹275"],
                        ["Aashirvaad Atta", "1 × ₹430", "₹430"],
                        ["Tata Salt Lite", "2 × ₹42", "₹84"],
                      ].map(([name, qty, price]) => (
                        <div key={name} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5">
                          <div>
                            <p className="text-[10px] font-bold text-slate-800">{name}</p>
                            <p className="mt-0.5 text-[9px] text-slate-400">{qty}</p>
                          </div>
                          <span className="text-[11px] font-black text-slate-900">{price}</span>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 flex items-end justify-between border-t border-slate-100 pt-4">
                      <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Total</span>
                      <span className="text-2xl font-black tracking-tight text-blue-600">₹789</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-1">
                    <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
                      <Zap className="h-5 w-5 text-blue-600" />
                      <p className="mt-5 text-[9px] font-black uppercase tracking-widest text-blue-600">Fast checkout</p>
                      <p className="mt-1 text-[10px] leading-5 text-slate-600">Keyboard-first billing for busy counters.</p>
                    </div>
                    <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                      <MessageCircle className="h-5 w-5 text-emerald-600" />
                      <p className="mt-5 text-[9px] font-black uppercase tracking-widest text-emerald-600">Udhaar</p>
                      <p className="mt-1 text-[10px] leading-5 text-slate-600">Keep customer balances organised.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </FadeIn>
        </section>

        {/* Feature intro */}
        <section id="features" className="scroll-mt-24 border-y border-slate-200/70 bg-white/60">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-28">
            <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
              <FadeIn>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600">Everything in one place</span>
                <h2 className="mt-4 text-4xl font-black tracking-[-0.04em] text-slate-950 sm:text-5xl">
                  Less admin.
                  <br />
                  More selling.
                </h2>
              </FadeIn>
              <FadeIn delay={0.08}>
                <p className="max-w-xl text-sm leading-7 text-slate-500 sm:text-base">
                  Kivo keeps the everyday retail workflow connected, so your team can move from product search to payment without jumping between disconnected tools.
                </p>
              </FadeIn>
            </div>

            <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {[
                { icon: Keyboard, title: "Fast POS", text: "Keyboard-first billing designed for rush-hour counters.", tone: "blue" },
                { icon: Package, title: "Inventory", text: "Products, stock movements and low-stock visibility in one place.", tone: "violet" },
                { icon: MessageCircle, title: "Udhaar", text: "Customer balances and payment tracking without the notebook.", tone: "emerald" },
                { icon: TrendingUp, title: "Reports", text: "Turn order data into useful sales and business insights.", tone: "amber" },
              ].map(({ icon: Icon, title, text, tone }, index) => (
                <FadeIn key={title} delay={index * 0.05}>
                  <div className="group h-full rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl">
                    <div className={
                      "flex h-11 w-11 items-center justify-center rounded-2xl " +
                      (tone === "blue" ? "bg-blue-50 text-blue-600" :
                        tone === "violet" ? "bg-violet-50 text-violet-600" :
                        tone === "emerald" ? "bg-emerald-50 text-emerald-600" :
                        "bg-amber-50 text-amber-600")
                    }>
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="mt-6 text-base font-black text-slate-900">{title}</h3>
                    <p className="mt-2 text-xs leading-6 text-slate-500">{text}</p>
                    <div className="mt-5 h-px w-8 bg-slate-200 transition-all group-hover:w-14 group-hover:bg-blue-500" />
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* Trust strip */}
        <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <div className="grid grid-cols-2 overflow-hidden rounded-3xl border border-slate-200 bg-white sm:grid-cols-4">
            {[
              { icon: Store, value: "Retail", label: "Built for shops" },
              { icon: Zap, value: "Fast", label: "Counter workflow" },
              { icon: Printer, value: "ESC/POS", label: "Thermal ready" },
              { icon: ShieldCheck, value: "Secure", label: "Server-authoritative data" },
            ].map(({ icon: Icon, value, label }, index) => (
              <div key={value} className={"flex items-center gap-3 px-5 py-5 sm:px-6 " + (index > 1 ? "border-t sm:border-t-0" : "") + (index % 2 === 1 ? " border-l" : " sm:border-l")}>
                <Icon className="h-4 w-4 shrink-0 text-slate-400" />
                <div>
                  <p className="text-xs font-black text-slate-900">{value}</p>
                  <p className="mt-0.5 text-[9px] text-slate-400">{label}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Ecosystem */}
        <section id="ecosystem" className="scroll-mt-24 bg-slate-950 py-20 text-white sm:py-28">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
              <FadeIn>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.2em] text-slate-300">
                  <Sparkles className="h-3 w-3" />
                  Kivo ecosystem
                </span>
                <h2 className="mt-5 max-w-2xl text-4xl font-black tracking-[-0.04em] sm:text-5xl">
                  One brand.
                  <br />
                  A growing toolkit.
                </h2>
              </FadeIn>
              <FadeIn delay={0.08}>
                <p className="max-w-sm text-sm leading-6 text-slate-400">
                  Explore the Kivo products built around your retail workflow.
                </p>
              </FadeIn>
            </div>

            <div className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-7">
              {ecosystem.map((item, index) => (
                <FadeIn key={item.alt} delay={index * 0.035}>
                  <Link
                    to={item.href}
                    className="group flex min-h-32 flex-col items-center justify-between rounded-2xl border border-white/10 bg-white/[0.045] p-4 transition duration-300 hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.08]"
                  >
                    <img src={item.src} alt={item.alt} loading="lazy" className="max-h-12 w-auto max-w-full object-contain transition duration-300 group-hover:scale-105" />
                    <span className="flex w-full items-center justify-between text-[10px] font-bold text-slate-400">
                      {item.label}
                      <ArrowRight className="h-3 w-3 opacity-0 transition group-hover:opacity-100" />
                    </span>
                  </Link>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="scroll-mt-24 bg-[#f7f8fa] px-4 py-20 sm:px-6 lg:py-28">
          <div className="mx-auto max-w-6xl">
            <FadeIn className="text-center">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600">Simple pricing</span>
              <h2 className="mt-4 text-4xl font-black tracking-[-0.04em] text-slate-950 sm:text-5xl">Start small. Scale when ready.</h2>
              <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-slate-500">
                Pick the plan that matches your counter today. You can change your plan as your shop grows.
              </p>

              <div className="mx-auto mt-7 inline-flex rounded-full border border-slate-200 bg-white p-1 shadow-sm">
                <button
                  onClick={() => setBillingCycle("monthly")}
                  className={"rounded-full px-5 py-2 text-[11px] font-bold transition " + (billingCycle === "monthly" ? "bg-slate-950 text-white shadow" : "text-slate-500 hover:text-slate-900")}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBillingCycle("annual")}
                  className={"rounded-full px-5 py-2 text-[11px] font-bold transition " + (billingCycle === "annual" ? "bg-blue-600 text-white shadow" : "text-slate-500 hover:text-slate-900")}
                >
                  Annual
                </button>
              </div>
            </FadeIn>

            <div className="mt-10 grid gap-4 lg:grid-cols-3">
              {plans[billingCycle].map((plan, index) => (
                <FadeIn key={plan.name} delay={index * 0.06}>
                  <div className={
                    "relative flex h-full flex-col rounded-3xl border p-6 sm:p-7 " +
                    (plan.featured
                      ? "border-blue-500 bg-slate-950 text-white shadow-[0_25px_70px_rgba(37,99,235,0.18)]"
                      : "border-slate-200 bg-white text-slate-950 shadow-sm")
                  }>
                    {plan.featured && (
                      <span className="absolute -top-3 left-6 rounded-full bg-blue-600 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-white">
                        Popular
                      </span>
                    )}
                    <p className={"text-[10px] font-black uppercase tracking-[0.18em] " + (plan.featured ? "text-blue-300" : "text-slate-400")}>{plan.name}</p>
                    <div className="mt-4 flex items-baseline gap-1">
                      <span className="text-4xl font-black tracking-tight">₹{plan.price}</span>
                      <span className={"text-xs " + (plan.featured ? "text-slate-400" : "text-slate-500")}>{plan.suffix}</span>
                    </div>
                    <p className={"mt-3 min-h-12 text-xs leading-5 " + (plan.featured ? "text-slate-400" : "text-slate-500")}>{plan.description}</p>

                    <ul className="mt-7 space-y-3">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-2.5 text-xs">
                          <Check className={"mt-0.5 h-4 w-4 shrink-0 " + (plan.featured ? "text-blue-400" : "text-emerald-500")} />
                          <span className={plan.featured ? "text-slate-200" : "text-slate-600"}>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <Link
                      to={plan.href}
                      className={
                        "mt-8 flex h-11 items-center justify-center gap-2 rounded-xl text-xs font-bold transition " +
                        (plan.featured
                          ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20 hover:bg-blue-500"
                          : "bg-slate-100 text-slate-900 hover:bg-slate-200")
                      }
                    >
                      {plan.cta}
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="px-4 pb-20 sm:px-6 lg:pb-28">
          <FadeIn>
            <div className="mx-auto max-w-5xl overflow-hidden rounded-[32px] bg-gradient-to-br from-blue-600 via-indigo-600 to-slate-950 px-6 py-12 text-center text-white shadow-2xl shadow-blue-900/15 sm:px-10 sm:py-16">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15">
                <MessageCircle className="h-6 w-6" />
              </div>
              <h2 className="mx-auto mt-5 max-w-2xl text-3xl font-black tracking-[-0.035em] sm:text-4xl">Ready to simplify your counter?</h2>
              <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-blue-100">
                Start with Kivo and build your daily retail workflow in one place.
              </p>
              <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
                <Link to="/register" className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-white px-6 text-xs font-black text-slate-950 transition hover:bg-blue-50">
                  Start free
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <a
                  href="https://wa.me/919876543210?text=Hi%2C%20I%20want%20to%20set%20up%20Kivo%20POS%20for%20my%20shop"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-white/20 bg-white/10 px-6 text-xs font-bold text-white transition hover:bg-white/15"
                >
                  <MessageCircle className="h-4 w-4" />
                  Talk to Kivo
                </a>
              </div>
            </div>
          </FadeIn>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white px-4 py-10 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 sm:flex-row">
          <Link to="/" className="flex items-center gap-2.5">
            <img src="/kivo-logo.png" alt="Kivo" className="h-7 w-auto" />
            <span className="text-[10px] font-semibold text-slate-400">Business Made Simple</span>
          </Link>
          <div className="flex flex-wrap items-center justify-center gap-5 text-[10px] font-semibold text-slate-400">
            <Link to="/privacy-policy" className="transition hover:text-slate-900">Privacy</Link>
            <Link to="/refund-policy" className="transition hover:text-slate-900">Refunds</Link>
            <a href="mailto:contact@officialdukaan.in" className="transition hover:text-slate-900">Support</a>
          </div>
          <p className="text-[10px] text-slate-400">© 2026 Kivo · PEAN</p>
        </div>
      </footer>
    </div>
  );
}
