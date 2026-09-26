import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowDown,
  ArrowRight,
  BarChart3,
  Check,
  CircleDollarSign,
  ClipboardList,
  CreditCard,
  Layers3,
  MessageCircle,
  Package,
  Receipt,
  RefreshCw,
  Sparkles,
  Store,
  Users,
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

const features = [
  {
    number: "01",
    icon: Receipt,
    eyebrow: "Billing",
    title: "Make every bill simple.",
    text: "Create bills quickly, keep payments organised, and keep the counter moving when the shop gets busy.",
    points: ["Fast billing workflow", "Cash and UPI payments", "Thermal receipt support"],
  },
  {
    number: "02",
    icon: Package,
    eyebrow: "Inventory",
    title: "Know what you have.",
    text: "Keep your product catalogue and stock movements connected to the sales happening every day.",
    points: ["Product management", "Stock adjustments", "Low-stock visibility"],
  },
  {
    number: "03",
    icon: Users,
    eyebrow: "Customers",
    title: "Keep customers organised.",
    text: "Store customer information alongside their orders and keep the relationship attached to the transaction.",
    points: ["Customer records", "Order history", "Customer-linked billing"],
  },
  {
    number: "04",
    icon: CircleDollarSign,
    eyebrow: "Udhaar",
    title: "Move beyond the notebook.",
    text: "Track customer balances and payments in a structured digital ledger instead of relying on scattered notes.",
    points: ["Udhaar balances", "Payment tracking", "Customer-linked ledger"],
  },
  {
    number: "05",
    icon: ClipboardList,
    eyebrow: "Orders",
    title: "Keep every order connected.",
    text: "Your orders become the shared source for the daily workflow, from checkout to reporting.",
    points: ["Order history", "Payment status", "Stock-aware checkout"],
  },
  {
    number: "06",
    icon: BarChart3,
    eyebrow: "Reports",
    title: "See what your shop is doing.",
    text: "Turn your recorded sales into useful reports for understanding day-to-day business activity.",
    points: ["Sales reporting", "Order-based insights", "Business summaries"],
  },
];

const plans = [
  {
    name: "Starter",
    price: "79",
    suffix: "/mo",
    description: "For a single counter getting started.",
    features: ["Fast POS Billing Engine", "Unlimited Products & Inventory", "Basic Order History"],
    href: "/subscribe?plan=starter",
  },
  {
    name: "Business",
    price: "119",
    suffix: "/mo",
    description: "For a growing retail workflow.",
    features: ["All Starter features", "58mm / 80mm Thermal Receipts", "WhatsApp Udhaar Khata Reminders", "Daily Profit & Expense Analytics"],
    href: "/subscribe?plan=business",
    featured: true,
  },
  {
    name: "Annual VIP",
    price: "1,499",
    suffix: "/yr",
    description: "Full-year access with premium billing tools.",
    features: ["Complete 12-Month Access", "Custom Shop Name & Logo on Bill", "Priority WhatsApp Onboarding"],
    href: "/subscribe?plan=premium",
  },
];

function Reveal({ children, delay = 0, className = "", distance = 56 }) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      initial={{ opacity: 0, y: reduced ? 0 : distance }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: false, amount: 0.2 }}
      transition={{ duration: reduced ? 0.01 : 0.7, delay: reduced ? 0 : delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function SectionLabel({ children }) {
  return <span className="text-[10px] font-black uppercase tracking-[0.24em] text-blue-600">{children}</span>;
}

export default function Landing() {
  const { user } = useAuth();
  const [billingCycle, setBillingCycle] = useState("monthly");

  const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

  const pricing = billingCycle === "monthly"
    ? plans
    : plans.map((plan, index) => index === 0
      ? { ...plan, price: "799", suffix: "/yr" }
      : index === 1
        ? { ...plan, price: "1,199", suffix: "/yr" }
        : plan);

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#fafafa] text-slate-950 selection:bg-blue-600/15">
      <header className="sticky top-3 z-50 px-3 sm:px-5">
        <nav className="mx-auto flex h-14 max-w-6xl items-center justify-between rounded-full border border-slate-200/80 bg-white/85 px-4 shadow-[0_12px_40px_rgba(15,23,42,0.07)] backdrop-blur-xl sm:h-16 sm:px-6">
          <Link to="/" className="flex items-center">
            <img src="/kivo-logo.png" alt="Kivo" className="h-7 w-auto sm:h-8" />
          </Link>
          <div className="hidden items-center gap-8 text-[12px] font-semibold text-slate-500 md:flex">
            <button onClick={() => scrollTo("features")} className="transition hover:text-slate-950">Features</button>
            <button onClick={() => scrollTo("ecosystem")} className="transition hover:text-slate-950">Ecosystem</button>
            <button onClick={() => scrollTo("pricing")} className="transition hover:text-slate-950">Pricing</button>
          </div>
          <div className="flex items-center gap-2">
            {!user && <Link to="/login" className="hidden px-3 py-2 text-xs font-semibold text-slate-600 sm:block">Sign in</Link>}
            <Link to={user ? "/app/pos" : "/register"} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-slate-950 px-4 text-[11px] font-bold text-white transition hover:bg-blue-600 sm:h-10 sm:px-5">
              {user ? "Open Kivo" : "Get started"} <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </nav>
      </header>

      <main>
        <section className="relative flex min-h-[calc(100vh-80px)] items-center overflow-hidden px-4 py-24 sm:px-6">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-1/2 top-10 h-[420px] w-[760px] -translate-x-1/2 rounded-full bg-blue-500/[0.07] blur-[120px]" />
            <div className="absolute right-[-10%] bottom-0 h-80 w-80 rounded-full bg-indigo-500/[0.06] blur-[100px]" />
          </div>
          <div className="relative mx-auto w-full max-w-6xl text-center">
            <Reveal>
              <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500 shadow-sm">
                <Sparkles className="h-3 w-3 text-blue-600" /> A product by PEAN
              </div>
            </Reveal>
            <Reveal delay={0.06}>
              <h1 className="mx-auto mt-8 max-w-5xl text-6xl font-black tracking-[-0.065em] sm:text-7xl lg:text-[104px] lg:leading-[0.9]">
                BUSINESS,
                <br />
                <span className="text-blue-600">MADE SIMPLE.</span>
              </h1>
            </Reveal>
            <Reveal delay={0.12}>
              <p className="mx-auto mt-8 max-w-2xl text-sm leading-7 text-slate-500 sm:text-base">
                Kivo brings billing, inventory, customers, Udhaar, orders and reports into one simple retail platform.
              </p>
            </Reveal>
            <Reveal delay={0.18}>
              <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
                <Link to={user ? "/app/pos" : "/register"} className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-blue-600 px-7 text-sm font-bold text-white shadow-xl shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-700">
                  {user ? "Open Kivo" : "Start with Kivo"} <ArrowRight className="h-4 w-4" />
                </Link>
                <button onClick={() => scrollTo("features")} className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-7 text-sm font-bold text-slate-700 transition hover:bg-slate-50">
                  Explore features <ArrowDown className="h-4 w-4" />
                </button>
              </div>
            </Reveal>
            <Reveal delay={0.24}>
              <div className="mt-20 flex justify-center">
                <button onClick={() => scrollTo("statement")} className="flex flex-col items-center gap-3 text-[9px] font-bold uppercase tracking-[0.25em] text-slate-400">
                  Scroll to explore <ArrowDown className="h-4 w-4 animate-bounce" />
                </button>
              </div>
            </Reveal>
          </div>
        </section>

        <section id="statement" className="scroll-mt-24 border-y border-slate-200 bg-white px-4 py-28 sm:px-6 lg:py-40">
          <div className="mx-auto max-w-5xl">
            <Reveal>
              <SectionLabel>The idea</SectionLabel>
              <h2 className="mt-6 max-w-4xl text-4xl font-black leading-tight tracking-[-0.045em] sm:text-6xl">
                Running a shop should not mean running ten different systems.
              </h2>
            </Reveal>
            <Reveal delay={0.08}>
              <p className="mt-8 max-w-2xl text-sm leading-7 text-slate-500 sm:text-base">
                Kivo is designed around the way a retail business actually moves: a product gets sold, stock changes, a customer may owe money, and the transaction becomes part of your business records.
              </p>
            </Reveal>
            <Reveal delay={0.14}>
              <div className="mt-14 grid gap-4 border-t border-slate-200 pt-8 sm:grid-cols-3">
                {[
                  ["Sell", "Create the transaction."],
                  ["Track", "Keep the business record."],
                  ["Understand", "Use the information later."],
                ].map(([title, text]) => (
                  <div key={title}>
                    <p className="text-xl font-black">{title}</p>
                    <p className="mt-2 text-xs leading-6 text-slate-500">{text}</p>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </section>

        <section id="features" className="scroll-mt-24 px-4 py-28 sm:px-6 lg:py-40">
          <div className="mx-auto max-w-6xl">
            <Reveal>
              <SectionLabel>Everything connected</SectionLabel>
              <h2 className="mt-5 max-w-3xl text-4xl font-black tracking-[-0.05em] sm:text-6xl">
                The tools your shop uses, without the clutter.
              </h2>
            </Reveal>

            <div className="mt-20 space-y-6 sm:mt-28">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                const reverse = index % 2 === 1;
                return (
                  <Reveal key={feature.number} delay={0.03} distance={70}>
                    <article className="grid min-h-[430px] overflow-hidden rounded-[32px] border border-slate-200 bg-white lg:grid-cols-2">
                      <div className={reverse ? "order-1 flex items-center p-8 sm:p-12 lg:order-2 lg:p-16" : "flex items-center p-8 sm:p-12 lg:p-16"}>
                        <div className="max-w-xl">
                          <div className="flex items-center gap-4">
                            <span className="font-mono text-[11px] font-bold text-slate-300">{feature.number}</span>
                            <div className="h-px w-10 bg-slate-200" />
                            <SectionLabel>{feature.eyebrow}</SectionLabel>
                          </div>
                          <h3 className="mt-7 text-4xl font-black tracking-[-0.045em] sm:text-5xl">{feature.title}</h3>
                          <p className="mt-6 text-sm leading-7 text-slate-500 sm:text-base">{feature.text}</p>
                          <ul className="mt-7 space-y-3">
                            {feature.points.map((point) => (
                              <li key={point} className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                                <Check className="h-4 w-4 text-blue-600" /> {point}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                      <div className={(reverse ? "order-2 lg:order-1" : "") + " relative flex min-h-64 items-center justify-center overflow-hidden bg-slate-950 p-10 text-white"}>
                        <div className="absolute h-72 w-72 rounded-full border border-white/10" />
                        <div className="absolute h-48 w-48 rounded-full border border-white/10" />
                        <div className="relative flex h-28 w-28 items-center justify-center rounded-[30px] border border-white/10 bg-white/[0.06] shadow-2xl backdrop-blur">
                          <Icon className="h-11 w-11 text-blue-400" />
                        </div>
                        <span className="absolute bottom-6 left-7 text-[9px] font-black uppercase tracking-[0.25em] text-white/35">{feature.eyebrow}</span>
                      </div>
                    </article>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>

        <section className="border-y border-slate-200 bg-white px-4 py-28 sm:px-6 lg:py-36">
          <div className="mx-auto max-w-6xl">
            <Reveal className="text-center">
              <SectionLabel>Everything connects</SectionLabel>
              <h2 className="mx-auto mt-5 max-w-3xl text-4xl font-black tracking-[-0.05em] sm:text-6xl">One flow. One source of truth.</h2>
            </Reveal>
            <Reveal delay={0.08}>
              <div className="mt-16 flex flex-wrap items-center justify-center gap-2 sm:gap-4">
                {[
                  [Receipt, "Billing"],
                  [Package, "Inventory"],
                  [Users, "Customers"],
                  [CircleDollarSign, "Udhaar"],
                  [ClipboardList, "Orders"],
                  [BarChart3, "Reports"],
                ].map(([Icon, label], index, arr) => (
                  <React.Fragment key={label}>
                    <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-3 shadow-sm">
                      <Icon className="h-4 w-4 text-blue-600" />
                      <span className="text-xs font-bold">{label}</span>
                    </div>
                    {index < arr.length - 1 && <ArrowRight className="hidden h-4 w-4 text-slate-300 sm:block" />}
                  </React.Fragment>
                ))}
              </div>
            </Reveal>
            <Reveal delay={0.14}>
              <p className="mx-auto mt-12 max-w-xl text-center text-xs leading-6 text-slate-400">
                The goal is simple: enter information once, then let the connected workflow do the rest.
              </p>
            </Reveal>
          </div>
        </section>

        <section id="ecosystem" className="scroll-mt-24 bg-slate-950 px-4 py-28 text-white sm:px-6 lg:py-36">
          <div className="mx-auto max-w-6xl">
            <Reveal>
              <SectionLabel>Kivo ecosystem</SectionLabel>
              <h2 className="mt-5 max-w-3xl text-4xl font-black tracking-[-0.05em] sm:text-6xl">More than one product. One ecosystem.</h2>
              <p className="mt-6 max-w-xl text-sm leading-7 text-slate-400">
                The Kivo ecosystem brings together products and tools built around different parts of the business experience.
              </p>
            </Reveal>
            <div className="mt-14 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-7">
              {ecosystem.map((item, index) => (
                <Reveal key={item.alt} delay={index * 0.04} distance={35}>
                  <Link to={item.href} className="group flex min-h-36 flex-col items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] p-4 transition hover:-translate-y-1 hover:bg-white/[0.08]">
                    <img src={item.src} alt={item.alt} loading="lazy" className="max-h-14 w-auto max-w-full object-contain transition group-hover:scale-105" />
                    <span className="flex w-full items-center justify-between text-[10px] font-bold text-slate-400">{item.label}<ArrowRight className="h-3 w-3 opacity-0 transition group-hover:opacity-100" /></span>
                  </Link>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 py-28 sm:px-6 lg:py-36">
          <div className="mx-auto max-w-6xl">
            <Reveal>
              <SectionLabel>Built to grow</SectionLabel>
              <h2 className="mt-5 max-w-4xl text-4xl font-black tracking-[-0.05em] sm:text-6xl">Start with the everyday work. Add more when you need it.</h2>
            </Reveal>
            <div className="mt-16 grid gap-4 md:grid-cols-3">
              {[
                [Store, "For the shop", "A focused workflow for everyday retail operations."],
                [Layers3, "For the workflow", "Products, orders, customers and records stay connected."],
                [RefreshCw, "For what comes next", "A product ecosystem that can grow with your business."],
              ].map(([Icon, title, text], index) => (
                <Reveal key={title} delay={index * 0.07}>
                  <div className="rounded-3xl border border-slate-200 bg-white p-7">
                    <Icon className="h-6 w-6 text-blue-600" />
                    <h3 className="mt-10 text-xl font-black">{title}</h3>
                    <p className="mt-3 text-sm leading-6 text-slate-500">{text}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section id="pricing" className="scroll-mt-24 border-y border-slate-200 bg-white px-4 py-28 sm:px-6 lg:py-36">
          <div className="mx-auto max-w-6xl">
            <Reveal className="text-center">
              <SectionLabel>Pricing</SectionLabel>
              <h2 className="mt-5 text-4xl font-black tracking-[-0.05em] sm:text-6xl">Simple plans. No complicated setup.</h2>
              <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-slate-500">Choose a plan for the way your shop works today.</p>
              <div className="mx-auto mt-8 inline-flex rounded-full border border-slate-200 bg-slate-50 p-1">
                <button onClick={() => setBillingCycle("monthly")} className={"rounded-full px-5 py-2 text-[11px] font-bold " + (billingCycle === "monthly" ? "bg-slate-950 text-white" : "text-slate-500")}>Monthly</button>
                <button onClick={() => setBillingCycle("annual")} className={"rounded-full px-5 py-2 text-[11px] font-bold " + (billingCycle === "annual" ? "bg-blue-600 text-white" : "text-slate-500")}>Annual</button>
              </div>
            </Reveal>
            <div className="mt-12 grid gap-4 lg:grid-cols-3">
              {pricing.map((plan, index) => (
                <Reveal key={plan.name} delay={index * 0.06}>
                  <div className={"relative flex h-full flex-col rounded-3xl border p-7 " + (plan.featured ? "border-blue-500 bg-slate-950 text-white" : "border-slate-200 bg-white")}>
                    {plan.featured && <span className="absolute -top-3 left-7 rounded-full bg-blue-600 px-3 py-1 text-[9px] font-black uppercase tracking-widest">Popular</span>}
                    <p className={"text-[10px] font-black uppercase tracking-[0.18em] " + (plan.featured ? "text-blue-300" : "text-slate-400")}>{plan.name}</p>
                    <div className="mt-5 flex items-baseline gap-1"><span className="text-4xl font-black">₹{plan.price}</span><span className="text-xs text-slate-400">{plan.suffix}</span></div>
                    <p className={"mt-3 min-h-10 text-xs leading-5 " + (plan.featured ? "text-slate-400" : "text-slate-500")}>{plan.description}</p>
                    <ul className="mt-7 space-y-3">
                      {plan.features.map((feature) => <li key={feature} className="flex gap-2.5 text-xs"><Check className={"mt-0.5 h-4 w-4 " + (plan.featured ? "text-blue-400" : "text-emerald-500")} /><span className={plan.featured ? "text-slate-200" : "text-slate-600"}>{feature}</span></li>)}
                    </ul>
                    <Link to={plan.href} className={"mt-8 flex h-11 items-center justify-center gap-2 rounded-xl text-xs font-bold " + (plan.featured ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-900")}>Choose {plan.name}<ArrowRight className="h-3.5 w-3.5" /></Link>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 py-28 sm:px-6 lg:py-36">
          <Reveal>
            <div className="mx-auto max-w-5xl rounded-[36px] bg-slate-950 px-6 py-16 text-center text-white sm:px-12 sm:py-20">
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-blue-400">Kivo by PEAN</span>
              <h2 className="mx-auto mt-6 max-w-3xl text-4xl font-black tracking-[-0.05em] sm:text-6xl">Your business is already moving. Let your tools keep up.</h2>
              <p className="mx-auto mt-6 max-w-xl text-sm leading-7 text-slate-400">Start with Kivo and bring the everyday parts of your retail business into one place.</p>
              <Link to={user ? "/app/pos" : "/register"} className="mt-9 inline-flex h-12 items-center gap-2 rounded-full bg-blue-600 px-7 text-sm font-bold text-white transition hover:bg-blue-500">{user ? "Open Kivo" : "Get started"}<ArrowRight className="h-4 w-4" /></Link>
            </div>
          </Reveal>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white px-4 py-10 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 sm:flex-row">
          <div>
            <Link to="/" className="flex items-center"><img src="/kivo-logo.png" alt="Kivo" className="h-7 w-auto" /></Link>
            <p className="mt-2 text-[10px] font-semibold text-slate-400">A product by PEAN</p>
          </div>
          <div className="flex flex-wrap justify-center gap-5 text-[10px] font-semibold text-slate-400">
            <Link to="/privacy-policy" className="hover:text-slate-900">Privacy</Link>
            <Link to="/refund-policy" className="hover:text-slate-900">Refunds</Link>
            <a href="mailto:contact@officialdukaan.in" className="hover:text-slate-900">Support</a>
          </div>
          <p className="text-[10px] text-slate-400">© 2026 Kivo · PEAN</p>
        </div>
      </footer>
    </div>
  );
}
