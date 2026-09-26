import React from "react";
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
  { number: "01", icon: Receipt, eyebrow: "Billing", title: "Make every bill simple.", text: "Create bills quickly, keep payments organised, and keep the counter moving when the shop gets busy.", points: ["Fast billing workflow", "Cash and UPI payments", "Thermal receipt support"] },
  { number: "02", icon: Package, eyebrow: "Inventory", title: "Know what you have.", text: "Keep your product catalogue and stock movements connected to the sales happening every day.", points: ["Product management", "Stock adjustments", "Low-stock visibility"] },
  { number: "03", icon: Users, eyebrow: "Customers", title: "Keep customers organised.", text: "Store customer information alongside their orders and keep the relationship attached to the transaction.", points: ["Customer records", "Order history", "Customer-linked billing"] },
  { number: "04", icon: CircleDollarSign, eyebrow: "Udhaar", title: "Move beyond the notebook.", text: "Track customer balances and payments in a structured digital ledger instead of relying on scattered notes.", points: ["Udhaar balances", "Payment tracking", "Customer-linked ledger"] },
  { number: "05", icon: ClipboardList, eyebrow: "Orders", title: "Keep every order connected.", text: "Your orders become the shared source for the daily workflow, from checkout to reporting.", points: ["Order history", "Payment status", "Stock-aware checkout"] },
  { number: "06", icon: BarChart3, eyebrow: "Reports", title: "See what your shop is doing.", text: "Turn recorded sales into useful reports for understanding day-to-day business activity.", points: ["Sales reporting", "Order-based insights", "Business summaries"] },
];

const plans = [
  { name: "Starter", price: "79", suffix: "/mo", description: "For a single counter getting started.", features: ["Fast POS Billing Engine", "Unlimited Products & Inventory", "Basic Order History"], href: "/subscribe?plan=starter" },
  { name: "Business", price: "119", suffix: "/mo", description: "For a growing retail workflow.", features: ["All Starter features", "58mm / 80mm Thermal Receipts", "WhatsApp Udhaar Khata Reminders", "Daily Profit & Expense Analytics"], href: "/subscribe?plan=business", featured: true },
  { name: "Annual VIP", price: "1,499", suffix: "/yr", description: "Full-year access with premium billing tools.", features: ["Complete 12-Month Access", "Custom Shop Name & Logo on Bill", "Priority WhatsApp Onboarding"], href: "/subscribe?plan=premium" },
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

function Line() {
  return <div className="h-px w-full bg-slate-200" />;
}

function SectionLabel({ children }) {
  return <span className="text-[10px] font-black uppercase tracking-[0.24em] text-blue-600">{children}</span>;
}

export default function Landing() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#fafafa] text-slate-950 selection:bg-blue-600/15">
      <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-[#fafafa]/90 backdrop-blur-xl">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <Link to="/" className="flex items-center">
            <img src="/kivo-logo.png" alt="Kivo" className="h-8 w-auto object-contain" />
          </Link>
          <div className="hidden items-center gap-7 text-sm font-semibold text-slate-600 md:flex">
            <a href="#features" className="transition-colors hover:text-slate-950">Features</a>
            <a href="#ecosystem" className="transition-colors hover:text-slate-950">Ecosystem</a>
            <a href="#pricing" className="transition-colors hover:text-slate-950">Pricing</a>
          </div>
          <div className="flex items-center gap-2">
            {!user && <Link to="/login" className="hidden rounded-full px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-white sm:block">Sign in</Link>}
            <Link to={user ? "/app" : "/register"} className="rounded-full bg-blue-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition-transform hover:-translate-y-0.5">
              {user ? "Open Kivo" : "Get started"}
            </Link>
          </div>
        </nav>
      </header>

      <main>
        <section className="relative flex min-h-[calc(100vh-73px)] items-center overflow-hidden border-b border-slate-200">
          <div className="absolute left-1/2 top-0 h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-blue-500/[0.07] blur-3xl" />
          <div className="relative mx-auto w-full max-w-5xl px-5 py-28 text-center sm:py-36">
            <Reveal>
              <SectionLabel>Business, made simple.</SectionLabel>
            </Reveal>
            <Reveal delay={0.08} distance={72}>
              <h1 className="mx-auto mt-7 max-w-4xl text-5xl font-black tracking-[-0.055em] sm:text-7xl lg:text-8xl">
                Run your business.
                <span className="block text-blue-600">Without the mess.</span>
              </h1>
            </Reveal>
            <Reveal delay={0.16}>
              <p className="mx-auto mt-7 max-w-2xl text-base leading-7 text-slate-500 sm:text-lg">
                Kivo brings billing, inventory, customers, Udhaar, orders and reports into one simple business system.
              </p>
            </Reveal>
            <Reveal delay={0.24}>
              <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link to={user ? "/app" : "/register"} className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/15">
                  {user ? "Open Kivo" : "Start with Kivo"} <ArrowRight size={16} />
                </Link>
                <a href="#features" className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-bold text-slate-800">
                  Explore features <ArrowDown size={16} />
                </a>
              </div>
            </Reveal>
            <Reveal delay={0.34} distance={24}>
              <div className="mt-20 flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">
                <span className="h-px w-10 bg-slate-300" /> Scroll to explore <span className="h-px w-10 bg-slate-300" />
              </div>
            </Reveal>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-28 sm:py-36">
          <Reveal>
            <SectionLabel>The idea</SectionLabel>
            <h2 className="mt-5 max-w-4xl text-4xl font-black tracking-[-0.04em] sm:text-6xl">
              One place for the work that keeps your shop moving.
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-8 max-w-2xl text-lg leading-8 text-slate-500">
              Instead of jumping between notebooks, spreadsheets and disconnected tools, Kivo keeps the important parts of your daily workflow together.
            </p>
          </Reveal>
          <div className="mt-20 grid gap-8 border-t border-slate-200 pt-8 sm:grid-cols-3">
            {[
              ["01", "Record", "Capture sales, products, customers and payments as they happen."],
              ["02", "Connect", "Keep orders, stock and customer activity linked together."],
              ["03", "Understand", "Use reports and summaries to see your business activity clearly."],
            ].map(([n, title, text], i) => (
              <Reveal key={title} delay={i * 0.08} distance={36}>
                <div>
                  <span className="text-xs font-black text-blue-600">{n}</span>
                  <h3 className="mt-4 text-xl font-black">{title}</h3>
                  <p className="mt-3 leading-7 text-slate-500">{text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        <section id="features" className="border-y border-slate-200 bg-white">
          <div className="mx-auto max-w-6xl px-5 py-28 sm:py-36">
            <Reveal>
              <SectionLabel>Everything you need</SectionLabel>
              <h2 className="mt-5 max-w-3xl text-4xl font-black tracking-[-0.04em] sm:text-6xl">
                Simple tools. Clear workflow.
              </h2>
            </Reveal>
            <Reveal delay={0.08}>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-500">
                Explore the core parts of Kivo, one by one.
              </p>
            </Reveal>

            <div className="mt-20">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div key={feature.number}>
                    <Line />
                    <Reveal delay={0.04} distance={64} className="py-16 sm:py-24">
                      <div className="grid gap-10 md:grid-cols-[120px_1fr_0.8fr] md:items-start">
                        <div className="text-sm font-black text-slate-300">{feature.number}</div>
                        <div>
                          <div className="flex items-center gap-3 text-blue-600">
                            <Icon size={20} />
                            <SectionLabel>{feature.eyebrow}</SectionLabel>
                          </div>
                          <h3 className="mt-5 max-w-xl text-3xl font-black tracking-[-0.035em] sm:text-5xl">{feature.title}</h3>
                        </div>
                        <div>
                          <p className="leading-8 text-slate-500">{feature.text}</p>
                          <ul className="mt-7 space-y-3">
                            {feature.points.map((point) => (
                              <li key={point} className="flex items-center gap-3 text-sm font-semibold text-slate-700">
                                <Check size={16} className="text-blue-600" /> {point}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </Reveal>
                    {index === features.length - 1 && <Line />}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-28 sm:py-36">
          <Reveal>
            <SectionLabel>Everything connects</SectionLabel>
            <h2 className="mt-5 max-w-3xl text-4xl font-black tracking-[-0.04em] sm:text-6xl">
              Your business has one flow. Kivo follows it.
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="mt-20 grid grid-cols-2 gap-px overflow-hidden rounded-3xl border border-slate-200 bg-slate-200 sm:grid-cols-3 lg:grid-cols-6">
              {[
                [Receipt, "Billing"],
                [Package, "Inventory"],
                [Users, "Customers"],
                [CircleDollarSign, "Udhaar"],
                [ClipboardList, "Orders"],
                [BarChart3, "Reports"],
              ].map(([Icon, label], i) => (
                <div key={label} className="bg-white p-6 text-center sm:p-8">
                  <Icon className="mx-auto text-blue-600" size={22} />
                  <p className="mt-4 text-sm font-black">{label}</p>
                  {i < 5 && <ArrowRight className="mx-auto mt-4 hidden text-slate-300 lg:block" size={14} />}
                </div>
              ))}
            </div>
          </Reveal>
        </section>

        <section id="ecosystem" className="border-y border-slate-200 bg-slate-950 text-white">
          <div className="mx-auto max-w-6xl px-5 py-28 sm:py-36">
            <Reveal>
              <SectionLabel>Kivo ecosystem</SectionLabel>
              <h2 className="mt-5 max-w-3xl text-4xl font-black tracking-[-0.04em] sm:text-6xl">
                One brand. More ways to grow.
              </h2>
              <p className="mt-6 max-w-2xl leading-8 text-slate-400">
                Explore the Kivo products and tools built around the business workflow.
              </p>
            </Reveal>
            <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {ecosystem.map((item, i) => (
                <Reveal key={item.label} delay={i * 0.05} distance={42}>
                  <Link to={item.href} className="group block rounded-3xl border border-white/10 bg-white/[0.04] p-7 transition hover:-translate-y-1 hover:bg-white/[0.07]">
                    <div className="flex h-24 items-center justify-center rounded-2xl bg-black/20">
                      <img src={item.src} alt={item.alt} loading="lazy" className="max-h-16 max-w-[85%] object-contain transition-transform group-hover:scale-105" />
                    </div>
                    <div className="mt-5 flex items-center justify-between">
                      <span className="font-bold">{item.label}</span>
                      <ArrowRight size={16} className="text-slate-500 transition group-hover:translate-x-1 group-hover:text-white" />
                    </div>
                  </Link>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-28 sm:py-36">
          <Reveal>
            <SectionLabel>Why Kivo</SectionLabel>
            <h2 className="mt-5 max-w-3xl text-4xl font-black tracking-[-0.04em] sm:text-6xl">
              Built around clarity, not complexity.
            </h2>
          </Reveal>
          <div className="mt-16 grid gap-10 md:grid-cols-3">
            {[
              [Layers3, "Everything together", "Keep the core parts of your daily business workflow connected."],
              [RefreshCw, "Always current", "Work from server-backed records instead of relying on disconnected local copies."],
              [Sparkles, "Made to grow", "Start with the tools you need and explore the wider Kivo ecosystem as your workflow grows."],
            ].map(([Icon, title, text], i) => (
              <Reveal key={title} delay={i * 0.08} distance={48}>
                <Icon className="text-blue-600" size={24} />
                <h3 className="mt-6 text-xl font-black">{title}</h3>
                <p className="mt-3 leading-7 text-slate-500">{text}</p>
              </Reveal>
            ))}
          </div>
        </section>

        <section id="pricing" className="border-y border-slate-200 bg-white">
          <div className="mx-auto max-w-6xl px-5 py-28 sm:py-36">
            <Reveal>
              <SectionLabel>Pricing</SectionLabel>
              <h2 className="mt-5 text-4xl font-black tracking-[-0.04em] sm:text-6xl">Start simple. Grow when you need to.</h2>
              <p className="mt-6 max-w-2xl leading-8 text-slate-500">Choose the plan that matches your current workflow.</p>
            </Reveal>
            <div className="mt-16 grid gap-5 lg:grid-cols-3">
              {plans.map((plan, i) => (
                <Reveal key={plan.name} delay={i * 0.08} distance={52}>
                  <div className={`h-full rounded-3xl border p-7 sm:p-8 ${plan.featured ? "border-blue-600 bg-blue-600 text-white shadow-xl shadow-blue-600/15" : "border-slate-200 bg-[#fafafa]"}`}>
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-black">{plan.name}</h3>
                      {plan.featured && <span className="rounded-full bg-white/15 px-3 py-1 text-[9px] font-black uppercase tracking-widest">Popular</span>}
                    </div>
                    <p className={`mt-3 text-sm leading-6 ${plan.featured ? "text-blue-100" : "text-slate-500"}`}>{plan.description}</p>
                    <div className="mt-8 flex items-end gap-1">
                      <span className="text-4xl font-black">₹{plan.price}</span>
                      <span className={`pb-1 text-sm ${plan.featured ? "text-blue-100" : "text-slate-400"}`}>{plan.suffix}</span>
                    </div>
                    <ul className="mt-8 space-y-4">
                      {plan.features.map((item) => <li key={item} className="flex gap-3 text-sm"><Check size={16} className={`mt-0.5 shrink-0 ${plan.featured ? "text-white" : "text-blue-600"}`} /> {item}</li>)}
                    </ul>
                    <Link to={plan.href} className={`mt-9 inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-bold ${plan.featured ? "bg-white text-blue-600" : "bg-slate-950 text-white"}`}>
                      Choose {plan.name} <ArrowRight size={15} />
                    </Link>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden bg-blue-600 text-white">
          <div className="absolute -right-32 -top-32 h-80 w-80 rounded-full border border-white/10" />
          <div className="absolute -bottom-40 -left-20 h-96 w-96 rounded-full border border-white/10" />
          <div className="relative mx-auto max-w-5xl px-5 py-32 text-center sm:py-40">
            <Reveal distance={48}>
              <SectionLabel>Ready when you are</SectionLabel>
              <h2 className="mx-auto mt-5 max-w-3xl text-5xl font-black tracking-[-0.05em] sm:text-7xl">Make business feel simpler.</h2>
              <p className="mx-auto mt-6 max-w-xl leading-8 text-blue-100">Bring your daily business workflow into Kivo and keep moving.</p>
              <Link to={user ? "/app" : "/register"} className="mt-9 inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-black text-blue-600">
                {user ? "Open Kivo" : "Get started"} <ArrowRight size={16} />
              </Link>
            </Reveal>
          </div>
        </section>
      </main>

      <footer className="bg-slate-950 text-slate-400">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 px-5 py-10 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <img src="/kivo-logo.png" alt="Kivo" className="h-7 w-auto brightness-0 invert" />
            <span className="text-xs">By PEAN</span>
          </div>
          <div className="flex flex-wrap gap-5 text-xs font-semibold">
            <Link to="/privacy-policy" className="hover:text-white">Privacy</Link>
            <Link to="/refund-policy" className="hover:text-white">Refund</Link>
            <Link to="/careers" className="hover:text-white">Careers</Link>
            <Link to="/info" className="hover:text-white">About</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
