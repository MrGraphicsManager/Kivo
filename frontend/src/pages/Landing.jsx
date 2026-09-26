import React from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  Check,
  CircleDollarSign,
  ClipboardList,
  Package,
  Receipt,
  RefreshCw,
  Sparkles,
  Store,
  Users,
} from "lucide-react";
import { useAuth } from "@/lib/AuthContext";

const ecosystem = [
  { src: "/kivo-pro.png", alt: "Kivo Pro", href: "/pro-plan", label: "Kivo Pro" },
  { src: "/kivo-premium.png", alt: "Kivo Premium", href: "/premium-plan", label: "Kivo Premium" },
  { src: "/kivo-cafe.png", alt: "Kivo Cafe Plan", href: "/subscribe?plan=cafe", label: "Kivo Cafe Plan" },
  { src: "/kivo-pro-studio.png", alt: "Kivo Pro Studio", href: "/pro-studio", label: "Kivo Pro Studio" },
  { src: "/kivo-ai.png", alt: "Kivo AI", href: "/pro-studio", label: "Kivo AI" },
  { src: "/kivo-grid.png", alt: "Kivo Grid", href: "/app", label: "Kivo Grid" },
  { src: "/kivo-admin.png", alt: "Kivo Admin", href: "/admin", label: "Kivo Admin" },
];

const features = [
  {
    number: "01",
    icon: Receipt,
    name: "Billing",
    title: "Every sale, organised.",
    text: "Create bills, record payments and keep the daily checkout workflow clear and connected.",
    points: ["Cash and UPI payments", "Thermal receipt support", "Server-backed orders"],
  },
  {
    number: "02",
    icon: Package,
    name: "Inventory",
    title: "Know your stock.",
    text: "Manage products, adjust stock and keep inventory activity connected to the orders you record.",
    points: ["Product catalogue", "Stock adjustments", "Low-stock visibility"],
  },
  {
    number: "03",
    icon: Users,
    name: "Customers",
    title: "Keep customer records close.",
    text: "Store customer details and connect them with the transactions and activity that matter.",
    points: ["Customer records", "Order history", "Customer-linked billing"],
  },
  {
    number: "04",
    icon: CircleDollarSign,
    name: "Udhaar",
    title: "Replace the scattered notebook.",
    text: "Keep balances and payments in a structured customer ledger that is easier to follow.",
    points: ["Udhaar balances", "Payment tracking", "Customer-linked ledger"],
  },
  {
    number: "05",
    icon: ClipboardList,
    name: "Orders",
    title: "One place for orders.",
    text: "Keep your order history connected to payments, products and the rest of your workflow.",
    points: ["Order history", "Payment status", "Stock-aware checkout"],
  },
  {
    number: "06",
    icon: BarChart3,
    name: "Reports",
    title: "Turn records into understanding.",
    text: "Use recorded business activity to review sales, orders and day-to-day performance.",
    points: ["Sales reporting", "Order-based insights", "Business summaries"],
  },
];

const plans = [
  {
    name: "Starter",
    price: "79",
    suffix: "/mo",
    text: "For a single counter getting started.",
    features: ["Fast POS Billing Engine", "Unlimited Products & Inventory", "Basic Order History"],
    href: "/subscribe?plan=starter",
  },
  {
    name: "Business",
    price: "119",
    suffix: "/mo",
    text: "For a growing retail workflow.",
    features: ["All Starter features", "58mm / 80mm Thermal Receipts", "WhatsApp Udhaar Khata Reminders", "Daily Profit & Expense Analytics"],
    href: "/subscribe?plan=business",
    featured: true,
  },
  {
    name: "Annual VIP",
    price: "1,499",
    suffix: "/yr",
    text: "Full-year access with premium billing tools.",
    features: ["Complete 12-Month Access", "Custom Shop Name & Logo on Bill", "Priority WhatsApp Onboarding"],
    href: "/subscribe?plan=premium",
  },
];

function Reveal({ children, delay = 0, distance = 42, className = "" }) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: reduced ? 0 : distance }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: false, amount: 0.18 }}
      transition={{
        duration: reduced ? 0.01 : 0.7,
        delay: reduced ? 0 : delay,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      {children}
    </motion.div>
  );
}

function Rule() {
  return <div className="h-px w-full bg-[#d6d5cd]" />;
}

function Label({ children, light = false }) {
  return (
    <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${light ? "text-[#aaa99f]" : "text-[#77766e]"}`}>
      {children}
    </span>
  );
}

export default function Landing() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#e9e9e2] text-[#171716] selection:bg-[#b9c0a9] selection:text-[#171716]">
      <header className="sticky top-0 z-50 border-b border-black/10 bg-[#e9e9e2]/95 backdrop-blur-md">
        <nav className="mx-auto flex max-w-[1180px] items-center justify-between px-4 py-4 sm:px-6">
          <Link to="/" className="flex items-center gap-3">
            <img src="/kivo-logo.png" alt="Kivo" className="h-8 w-auto object-contain" />
            <span className="hidden rounded-full bg-[#d8d8d0] px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.16em] text-[#55544d] sm:block">
              Business OS
            </span>
          </Link>

          <div className="hidden items-center gap-8 text-[12px] font-bold md:flex">
            <a href="#work" className="transition-opacity hover:opacity-60">Features</a>
            <a href="#ecosystem" className="transition-opacity hover:opacity-60">Ecosystem</a>
            <a href="#pricing" className="transition-opacity hover:opacity-60">Pricing</a>
          </div>

          <div className="flex items-center gap-2">
            {!user && (
              <Link to="/login" className="hidden px-3 py-2 text-[12px] font-bold sm:block">
                Sign in
              </Link>
            )}
            <Link
              to={user ? "/app" : "/register"}
              className="rounded-full bg-[#171716] px-4 py-2.5 text-[11px] font-black text-white transition-transform hover:-translate-y-0.5"
            >
              {user ? "Open Kivo ↗" : "Start with Kivo ↗"}
            </Link>
          </div>
        </nav>
      </header>

      <main>
        <section className="mx-auto max-w-[1180px] px-4 pb-20 pt-20 sm:px-6 sm:pb-28 sm:pt-28">
          <Reveal>
            <Label>KIVO • BUSINESS • RETAIL</Label>
          </Reveal>

          <Reveal delay={0.08} distance={70}>
            <h1 className="mt-7 max-w-[980px] font-serif text-[clamp(3.5rem,9vw,8.2rem)] font-bold leading-[0.88] tracking-[-0.065em]">
              Run your business.
              <em className="block font-serif font-normal text-[#5c6354]">Keep it simple.</em>
            </h1>
          </Reveal>

          <Reveal delay={0.16}>
            <div className="mt-10 grid gap-8 border-t border-[#bdbcb4] pt-7 md:grid-cols-[1fr_0.55fr] md:items-end">
              <p className="max-w-[650px] text-base leading-7 text-[#5d5c55] sm:text-lg">
                Kivo brings the everyday work of a shop into one connected system — billing, inventory, customers, Udhaar, orders and reports.
              </p>
              <div className="flex gap-2 md:justify-end">
                <Link to={user ? "/app" : "/register"} className="rounded-full bg-[#171716] px-5 py-3 text-[11px] font-black text-white">
                  {user ? "Open Kivo" : "Get started"} ↗
                </Link>
                <a href="#work" className="rounded-full border border-[#aaa99f] bg-transparent px-5 py-3 text-[11px] font-black">
                  Explore ↓
                </a>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.25} distance={24}>
            <div className="mt-16 flex items-center gap-3 text-[9px] font-black uppercase tracking-[0.22em] text-[#85847b]">
              <span className="h-px w-12 bg-[#aaa99f]" />
              Scroll to explore
              <span className="h-px w-12 bg-[#aaa99f]" />
            </div>
          </Reveal>
        </section>

        <div className="overflow-hidden border-y border-[#171716] bg-[#171716] py-4 text-white">
          <motion.div
            className="flex min-w-max items-center gap-8 whitespace-nowrap text-[10px] font-black uppercase tracking-[0.2em]"
            animate={{ x: ["0%", "-50%"] }}
            transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
          >
            {Array.from({ length: 2 }).flatMap(() =>
              ["BILLING", "INVENTORY", "CUSTOMERS", "UDHAAR", "ORDERS", "REPORTS", "KIVO"].map((item, i) => (
                <React.Fragment key={item + i + Math.random()}>
                  <span>{item}</span>
                  <span className="text-[#b9c0a9]">✦</span>
                </React.Fragment>
              ))
            )}
          </motion.div>
        </div>

        <section id="work" className="mx-auto max-w-[1180px] px-4 py-24 sm:px-6 sm:py-32">
          <Reveal>
            <div className="grid gap-8 md:grid-cols-[1fr_0.7fr] md:items-end">
              <div>
                <Label>THE CORE</Label>
                <h2 className="mt-4 max-w-[720px] font-serif text-4xl font-bold tracking-[-0.045em] sm:text-6xl">
                  The work behind a better business day.
                </h2>
              </div>
              <p className="text-sm leading-7 text-[#68675f]">
                Kivo is designed around the actual flow of business. Record what happens, keep the important pieces connected, and review the result.
              </p>
            </div>
          </Reveal>

          <div className="mt-16">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={feature.number}>
                  <Rule />
                  <Reveal delay={0.04} distance={55} className="py-14 sm:py-20">
                    <div className="grid gap-8 md:grid-cols-[80px_1fr_0.85fr]">
                      <div className="text-[11px] font-black text-[#96958c]">{feature.number}</div>
                      <div>
                        <div className="flex items-center gap-3">
                          <Icon size={19} strokeWidth={2.2} />
                          <Label>{feature.name}</Label>
                        </div>
                        <h3 className="mt-5 max-w-[620px] font-serif text-3xl font-bold leading-tight tracking-[-0.035em] sm:text-5xl">
                          {feature.title}
                        </h3>
                      </div>
                      <div>
                        <p className="text-sm leading-7 text-[#626159]">{feature.text}</p>
                        <ul className="mt-6 space-y-3">
                          {feature.points.map((point) => (
                            <li key={point} className="flex items-center gap-2 text-[12px] font-bold">
                              <Check size={14} /> {point}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </Reveal>
                  {index === features.length - 1 && <Rule />}
                </div>
              );
            })}
          </div>
        </section>

        <section className="bg-[#171716] py-24 text-white sm:py-32">
          <div className="mx-auto max-w-[1180px] px-4 sm:px-6">
            <Reveal>
              <div className="grid gap-8 md:grid-cols-[1fr_0.65fr] md:items-end">
                <div>
                  <Label light>HOW IT CONNECTS</Label>
                  <h2 className="mt-4 max-w-[700px] font-serif text-4xl font-bold tracking-[-0.045em] sm:text-6xl">
                    One business flow. Less jumping around.
                  </h2>
                </div>
                <p className="text-sm leading-7 text-[#a7a69d]">
                  The same business activity can support multiple parts of your workflow instead of being entered and maintained separately.
                </p>
              </div>
            </Reveal>

            <div className="mt-16 grid grid-cols-2 border-t border-[#393936] sm:grid-cols-3 lg:grid-cols-6">
              {[
                [Receipt, "Billing"],
                [Package, "Inventory"],
                [Users, "Customers"],
                [CircleDollarSign, "Udhaar"],
                [ClipboardList, "Orders"],
                [BarChart3, "Reports"],
              ].map(([Icon, name], i) => (
                <Reveal key={name} delay={i * 0.06} distance={30}>
                  <div className="border-b border-r border-[#393936] p-6 sm:p-8">
                    <Icon size={21} className="text-[#b9c0a9]" />
                    <div className="mt-12 flex items-end justify-between gap-3">
                      <span className="text-sm font-black">{name}</span>
                      <span className="text-[10px] text-[#77766e]">0{i + 1}</span>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section id="ecosystem" className="mx-auto max-w-[1180px] px-4 py-24 sm:px-6 sm:py-32">
          <Reveal>
            <Label>THE ECOSYSTEM</Label>
            <h2 className="mt-4 max-w-[760px] font-serif text-4xl font-bold tracking-[-0.045em] sm:text-6xl">
              Kivo is more than one screen.
            </h2>
            <p className="mt-6 max-w-[620px] text-sm leading-7 text-[#68675f]">
              Explore the products and tools around the Kivo business ecosystem.
            </p>
          </Reveal>

          <div className="mt-14 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {ecosystem.map((item, index) => (
              <Reveal key={item.label} delay={index * 0.05} distance={38}>
                <Link
                  to={item.href}
                  className="group block rounded-2xl border border-[#cecdc5] bg-[#f3f3ed] p-5 transition duration-300 hover:-translate-y-1 hover:bg-white"
                >
                  <div className="flex h-28 items-center justify-center rounded-xl bg-[#e4e4dc]">
                    <img src={item.src} alt={item.alt} loading="lazy" className="max-h-20 max-w-[82%] object-contain transition-transform duration-300 group-hover:scale-105" />
                  </div>
                  <div className="mt-5 flex items-center justify-between">
                    <span className="text-sm font-black">{item.label}</span>
                    <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </section>

        <section className="border-y border-[#171716] bg-[#dfe0d7]">
          <div className="mx-auto max-w-[1180px] px-4 py-24 sm:px-6 sm:py-32">
            <Reveal>
              <div className="grid gap-10 md:grid-cols-2">
                <div>
                  <Label>WHY KIVO</Label>
                  <h2 className="mt-4 max-w-[650px] font-serif text-4xl font-bold tracking-[-0.045em] sm:text-6xl">
                    Built to make the everyday work feel clearer.
                  </h2>
                </div>
                <div className="grid gap-8 sm:grid-cols-3 md:pt-10">
                  {[
                    [Store, "Business first", "The product is organised around day-to-day shop work."],
                    [RefreshCw, "Connected records", "Core workflows use server-backed business data."],
                    [Sparkles, "Growing ecosystem", "Kivo products can extend the wider workflow."],
                  ].map(([Icon, title, text], i) => (
                    <Reveal key={title} delay={i * 0.08} distance={35}>
                      <Icon size={21} />
                      <h3 className="mt-5 text-base font-black">{title}</h3>
                      <p className="mt-2 text-xs leading-6 text-[#66655e]">{text}</p>
                    </Reveal>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        <section id="pricing" className="mx-auto max-w-[1180px] px-4 py-24 sm:px-6 sm:py-32">
          <Reveal>
            <Label>PLANS</Label>
            <h2 className="mt-4 max-w-[700px] font-serif text-4xl font-bold tracking-[-0.045em] sm:text-6xl">
              Start with what you need.
            </h2>
            <p className="mt-5 max-w-[580px] text-sm leading-7 text-[#68675f]">
              Simple options for different business workflows.
            </p>
          </Reveal>

          <div className="mt-14 grid gap-3 lg:grid-cols-3">
            {plans.map((plan, index) => (
              <Reveal key={plan.name} delay={index * 0.08} distance={48}>
                <div className={`h-full rounded-2xl border p-7 ${plan.featured ? "border-[#171716] bg-[#171716] text-white" : "border-[#cecdc5] bg-[#f3f3ed]"}`}>
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-black">{plan.name}</h3>
                    {plan.featured && (
                      <span className="rounded-full bg-white/10 px-3 py-1 text-[8px] font-black uppercase tracking-[0.15em]">Popular</span>
                    )}
                  </div>
                  <p className={`mt-3 text-xs leading-6 ${plan.featured ? "text-[#aaa99f]" : "text-[#68675f]"}`}>{plan.text}</p>
                  <div className="mt-8">
                    <span className="font-serif text-5xl font-bold tracking-[-0.05em]">₹{plan.price}</span>
                    <span className={`ml-1 text-xs ${plan.featured ? "text-[#aaa99f]" : "text-[#77766e]"}`}>{plan.suffix}</span>
                  </div>
                  <ul className="mt-8 space-y-4">
                    {plan.features.map((item) => (
                      <li key={item} className="flex gap-2 text-xs leading-5">
                        <Check size={14} className="mt-0.5 shrink-0" /> {item}
                      </li>
                    ))}
                  </ul>
                  <Link
                    to={plan.href}
                    className={`mt-9 inline-flex w-full items-center justify-center rounded-full px-5 py-3 text-[11px] font-black ${plan.featured ? "bg-white text-[#171716]" : "bg-[#171716] text-white"}`}
                  >
                    Choose {plan.name} ↗
                  </Link>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        <section className="bg-[#171716] text-white">
          <div className="mx-auto max-w-[1180px] px-4 py-28 text-center sm:px-6 sm:py-36">
            <Reveal distance={55}>
              <Label light>READY WHEN YOU ARE</Label>
              <h2 className="mx-auto mt-5 max-w-[820px] font-serif text-5xl font-bold leading-[0.95] tracking-[-0.055em] sm:text-7xl">
                Make business feel simpler.
              </h2>
              <p className="mx-auto mt-6 max-w-[520px] text-sm leading-7 text-[#aaa99f]">
                Bring your daily workflow into Kivo and keep the important work connected.
              </p>
              <Link
                to={user ? "/app" : "/register"}
                className="mt-9 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-[11px] font-black text-[#171716]"
              >
                {user ? "Open Kivo" : "Get started"} <ArrowRight size={15} />
              </Link>
            </Reveal>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#393936] bg-[#171716] px-4 py-8 text-[#85847b] sm:px-6">
        <div className="mx-auto flex max-w-[1180px] flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <img src="/kivo-logo.png" alt="Kivo" className="h-7 w-auto brightness-0 invert" />
            <span className="text-[10px]">By PEAN</span>
          </div>
          <div className="flex flex-wrap gap-5 text-[10px] font-bold">
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
