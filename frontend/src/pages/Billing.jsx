import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, money } from "@/lib/api";
import { useAuth, getPersistentSubscription, getPersistentUpcomingSubscription } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { 
  CreditCard, 
  Crown, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  Sparkles, 
  ArrowRight,
  Receipt,
  ExternalLink,
  Download,
  AlertCircle,
  Zap,
  Calendar,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  Check
} from "lucide-react";

export const PLAN_RANK = {
  starter: 1,
  business: 2,
  cafe: 2.5,
  premium: 3,
  pro: 4,
};

const TIER_PLANS = [
  {
    id: "starter",
    name: "Starter",
    price: 79,
    originalPrice: 99,
    discount: "20% OFF",
    setup: 299,
    badge: "Solo Shop",
    features: [
      "Fast POS Billing & Invoices",
      "Unlimited Products & Inventory",
      "Order History & Basic Reports",
      "Standard Dashboard Access",
    ]
  },
  {
    id: "business",
    name: "Business",
    price: 119,
    originalPrice: 149,
    discount: "20% OFF",
    setup: 499,
    featured: true,
    badge: "Most Popular",
    features: [
      "Everything in Starter",
      "Customer Khata Directory",
      "Udhaar & WhatsApp 1-Tap Reminders",
      "Low Stock Automated Alerts",
      "Daily & Monthly Sales Analytics"
    ]
  },
  {
    id: "cafe",
    name: "Cafe Plan",
    price: 149,
    originalPrice: 199,
    discount: "Coming Soon",
    offerBadge: "+2 Mo Free Pro",
    setup: 0,
    badge: "Coming Soon",
    is_cafe: true,
    features: [
      "🎁 Bonus: 2 Mo Free Dukaan Pro",
      "Dedicated Cafe Dashboard (Coming Soon)",
      "Table Management & Dine-In Status",
      "Kitchen Order Tickets (KOT)",
      "Digital Menu & QR Ordering",
      "Basic Stock & Recipe Inventory",
      "Staff Accounts & Waiter Roles",
      "Powered by NexoraOS (by PEAN)"
    ]
  },
  {
    id: "premium",
    name: "Premium",
    price: 239,
    originalPrice: 299,
    discount: "20% OFF",
    setup: 999,
    badge: "Full Power",
    features: [
      "Everything in Business",
      "Multi-Shop Headquarter Support",
      "Full FY Tax & Profit Audit",
      "GST Invoicing & Verification",
      "Priority Support & Soundbox"
    ]
  },
  {
    id: "pro",
    name: "Dukaan Pro",
    price: 499,
    originalPrice: null,
    offerBadge: "1+1 Month Free",
    setup: 0,
    is_pro: true,
    badge: "Flagship Plan",
    features: [
      "Everything in Premium",
      "Custom Billing & Invoices",
      "Custom Dashboard & Widgets",
      "Customize Everything",
      "Early Access to New Updates",
      "24/7 Dedicated Support"
    ]
  }
];

export default function Billing() {
  const nav = useNavigate();
  const { user, refresh } = useAuth();
  
  // 1. Current Running Plan State
  const [sub, setSub] = useState(() => {
    let localSub = user?.subscription || null;
    if (!localSub) {
      try {
        const u = JSON.parse(localStorage.getItem("dukaan_user") || "{}");
        localSub = u?.subscription || null;
      } catch {}
    }
    if (!localSub && user?.email) {
      localSub = getPersistentSubscription(user.email);
    }
    return localSub;
  });

  // 2. Upcoming / Queued Plan State
  const [upcomingSub, setUpcomingSub] = useState(() => {
    let localUpcoming = user?.upcoming_subscription || null;
    if (!localUpcoming) {
      try {
        const u = JSON.parse(localStorage.getItem("dukaan_user") || "{}");
        localUpcoming = u?.upcoming_subscription || null;
      } catch {}
    }
    if (!localUpcoming && user?.email) {
      try {
        const allQueued = JSON.parse(localStorage.getItem("dukaan_upcoming_subscriptions") || "{}");
        localUpcoming = allQueued[user.email.toLowerCase().trim()] || null;
      } catch {}
    }
    return localUpcoming;
  });

  const [loading, setLoading] = useState(false);
  const [activating, setActivating] = useState(false);

  useEffect(() => {
    let localSub = user?.subscription || null;
    let localUpcoming = user?.upcoming_subscription || null;
    if (!localSub) {
      try {
        const u = JSON.parse(localStorage.getItem("dukaan_user") || "{}");
        localSub = u?.subscription || null;
        if (!localUpcoming) localUpcoming = u?.upcoming_subscription || null;
      } catch {}
    }
    if (localSub) setSub(localSub);
    if (localUpcoming) setUpcomingSub(localUpcoming);

    const syncSub = () => {
      api.get("/subscriptions/me")
        .then(r => { 
          if (r.data?.active) {
            const serverActive = r.data.active;
            setSub(prevSub => {
              const prevExp = prevSub?.expires_at ? new Date(prevSub.expires_at).getTime() : 0;
              const serverExp = serverActive?.expires_at ? new Date(serverActive.expires_at).getTime() : 0;
              if (prevExp > serverExp) {
                return prevSub;
              }
              return serverActive;
            });

            const stored = localStorage.getItem("dukaan_user");
            if (stored) {
              try {
                const u = JSON.parse(stored);
                const localExp = u.subscription?.expires_at ? new Date(u.subscription.expires_at).getTime() : 0;
                const serverExp = serverActive?.expires_at ? new Date(serverActive.expires_at).getTime() : 0;

                if (serverExp >= localExp) {
                  u.subscription = serverActive;
                  if (serverActive.plan === "premium" || serverActive.plan === "pro") u.is_premium = true;
                  if (serverActive.plan === "pro") u.is_pro = true;
                }
                if (r.data?.upcoming || r.data?.queued) {
                  const queuedSub = r.data.upcoming || r.data.queued;
                  u.upcoming_subscription = queuedSub;
                  setUpcomingSub(queuedSub);
                }
                localStorage.setItem("dukaan_user", JSON.stringify(u));
                if (u.email) {
                  const allSubs = JSON.parse(localStorage.getItem("dukaan_all_subscriptions") || "{}");
                  allSubs[u.email.toLowerCase().trim()] = u.subscription;
                  localStorage.setItem("dukaan_all_subscriptions", JSON.stringify(allSubs));
                }
              } catch {}
            }
          }

          if (r.data?.upcoming || r.data?.queued) {
            const queuedSub = r.data.upcoming || r.data.queued;
            setUpcomingSub(queuedSub);
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    };

    syncSub();
    const interval = setInterval(syncSub, 5000);
    window.addEventListener("focus", syncSub);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", syncSub);
    };
  }, [user?.subscription, user?.upcoming_subscription]);

  // Instant Activation Handler
  const handleActivateNow = async (skipConfirm = false) => {
    if (!upcomingSub) return;
    const planName = upcomingSub.plan_name || upcomingSub.plan?.toUpperCase() || "New";
    const durationDays = Number(upcomingSub.duration_days) || (upcomingSub.plan === "pro" ? 60 : 30);
    const cycles = upcomingSub.cycle_count || Math.max(1, Math.round(durationDays / (upcomingSub.plan === "pro" ? 60 : 30)));

    if (!skipConfirm) {
      const ok = window.confirm(
        `Activate ${planName} Plan right now?\n\n` +
        `Your new plan benefits will begin immediately, and ALL remaining time (${durationDays} days${cycles > 1 ? ` across ${cycles} queued cycles` : ""}) will roll over into your active subscription so you lose zero days!`
      );
      if (!ok) return;
    }

    setActivating(true);
    try {
      const curExp = sub?.expires_at ? new Date(sub.expires_at).getTime() : 0;
      const baseMs = Math.max(Date.now(), curExp);
      const newExpiry = new Date(baseMs + durationDays * 86400000).toISOString();

      const newActive = {
        plan: upcomingSub.plan,
        status: "active",
        is_annual: Boolean(upcomingSub.is_annual),
        razorpay_order_id: upcomingSub.razorpay_order_id,
        razorpay_payment_id: upcomingSub.razorpay_payment_id,
        expires_at: newExpiry,
        activated_at: new Date().toISOString()
      };

      setSub(newActive);
      setUpcomingSub(null);

      const rawUser = localStorage.getItem("dukaan_user");
      const parsed = rawUser ? JSON.parse(rawUser) : { email: user?.email || "owner@dukaan.in" };
      parsed.subscription = newActive;
      parsed.upcoming_subscription = null;
      if (newActive.plan === "premium" || newActive.plan === "pro") parsed.is_premium = true;
      if (newActive.plan === "pro") parsed.is_pro = true;
      localStorage.setItem("dukaan_user", JSON.stringify(parsed));

      const userEmail = (user?.email || parsed.email || "").toLowerCase().trim();
      if (userEmail) {
        try {
          const allSubs = JSON.parse(localStorage.getItem("dukaan_all_subscriptions") || "{}");
          allSubs[userEmail] = newActive;
          localStorage.setItem("dukaan_all_subscriptions", JSON.stringify(allSubs));
        } catch {}
        try {
          const allQueued = JSON.parse(localStorage.getItem("dukaan_upcoming_subscriptions") || "{}");
          delete allQueued[userEmail];
          localStorage.setItem("dukaan_upcoming_subscriptions", JSON.stringify(allQueued));
        } catch {}
        try {
          let regUsers = JSON.parse(localStorage.getItem("dukaan_registered_users") || "[]");
          const idx = regUsers.findIndex(u => u.email && u.email.toLowerCase() === userEmail);
          if (idx >= 0) {
            regUsers[idx].subscription = newActive;
            regUsers[idx].upcoming_subscription = null;
            if (newActive.plan === "premium" || newActive.plan === "pro") regUsers[idx].is_premium = true;
            if (newActive.plan === "pro") regUsers[idx].is_pro = true;
            localStorage.setItem("dukaan_registered_users", JSON.stringify(regUsers));
          }
        } catch {}
      }

      try {
        await api.post("/subscriptions/activate-queued", {
          user_email: userEmail,
          upcoming_subscription: upcomingSub
        });
      } catch (_) {}

      window.dispatchEvent(new CustomEvent("dukaan_subscription_updated"));
      if (refresh) refresh();
      toast.success(`🎉 ${planName} Plan Activated! Valid until ${newExpiry.slice(0, 10)} (${durationDays} days rolled over).`);
    } catch (e) {
      toast.error("Failed to activate plan instantly. Please try again.");
    } finally {
      setActivating(false);
    }
  };

  const currentPlanId = sub?.plan || user?.subscription?.plan || "business";
  const currentRank = PLAN_RANK[currentPlanId] || 2;

  return (
    <div className="space-y-8 animate-fade-up max-w-[1400px] mx-auto pb-16 font-sans">
      
      {/* =========================================================
          HERO BANNER (DUKAAN 3.0 MODERN DARK GRADIENT)
      ========================================================= */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 dark:from-slate-950 dark:via-indigo-950/80 dark:to-slate-950 border border-slate-800 p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl">
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex items-center gap-4">
          <div className="w-13 h-13 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center shrink-0 text-blue-400">
            <CreditCard className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold font-mono">STORE MEMBERSHIP</span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-[11px] font-bold text-emerald-300 border border-emerald-500/30">
                Active Subscription
              </span>
            </div>
            <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight text-white">
              Billing & Subscription Plans
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Manage your active store license, scheduled renewals, and upgrade tier anytime.
            </p>
          </div>
        </div>

        <div className="relative z-10">
          <Button
            onClick={() => nav(`/subscribe?plan=${currentPlanId}`)}
            className="h-11 px-5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Crown className="w-4 h-4" />
            <span>Manage Subscription</span>
          </Button>
        </div>
      </div>

      {/* =========================================================
          TWO-PLAN STATUS SECTION (CURRENT PLAN & UPCOMING PLAN)
      ========================================================= */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Your Store Membership</span>
              {upcomingSub && (
                <span className="text-xs font-mono font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                  2 Plans Active & Queued
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {upcomingSub 
                ? "Your currently running plan and next scheduled cycle are both confirmed below."
                : "Active subscription details and renewal lifecycle."}
            </p>
          </div>
        </div>

        <div className={`grid grid-cols-1 ${upcomingSub ? "lg:grid-cols-2" : "grid-cols-1"} gap-4 sm:gap-6`}>
          
          {/* -------------------------------------------------------
              CARD 1: CURRENT RUNNING PLAN
          ------------------------------------------------------- */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col justify-between relative overflow-hidden">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Crown className="w-4 h-4 text-amber-500" />
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                    Currently Running Plan
                  </span>
                </div>
                <h3 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white capitalize">
                  {currentPlanId} Plan
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md">
                  Unlimited POS billing, customer khata ledger, and real-time inventory management active.
                </p>
              </div>

              <div className="text-right shrink-0">
                {(() => {
                  const isExpired = sub?.expires_at && new Date(sub.expires_at).getTime() < Date.now();
                  const daysLeft = sub?.expires_at ? Math.ceil((new Date(sub.expires_at).getTime() - Date.now()) / 86400000) : null;
                  const isExpiringSoon = daysLeft !== null && daysLeft <= 3 && daysLeft >= 0;

                  if (isExpired) {
                    return (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-bold border border-rose-500/20">
                        <AlertCircle className="w-3.5 h-3.5 text-rose-600" /> Expired
                      </span>
                    );
                  }
                  if (isExpiringSoon) {
                    return (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold border border-amber-500/20">
                        <Clock className="w-3.5 h-3.5 text-amber-600" /> Expiring in {daysLeft} {daysLeft === 1 ? "day" : "days"}
                      </span>
                    );
                  }
                  return (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-500/20">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Verified Active
                    </span>
                  );
                })()}
              </div>
            </div>

            <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-400">Renews / Ends On</div>
                <div className="font-heading font-extrabold text-base text-slate-900 dark:text-white mt-0.5">
                  {(sub?.expires_at || "2027-03-31").slice(0, 10)}
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-400">Billing Cycle</div>
                <div className="font-heading font-extrabold text-base text-slate-900 dark:text-white mt-0.5 capitalize">
                  {sub?.is_annual ? "Annual (365d)" : "Monthly (30d)"}
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-400">Status</div>
                <div className="font-heading font-extrabold text-base text-emerald-600 dark:text-emerald-400 mt-0.5 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5 text-emerald-600" /> Live Serving
                </div>
              </div>
            </div>
          </div>

          {/* -------------------------------------------------------
              CARD 2: UPCOMING SCHEDULED PLAN (PAID & CONFIRMED)
          ------------------------------------------------------- */}
          {upcomingSub && (
            <div className="rounded-2xl p-6 bg-amber-50/50 dark:bg-amber-950/20 border-2 border-amber-400/80 shadow-2xs flex flex-col justify-between relative overflow-hidden">
              <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />

              <div>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="inline-flex items-center gap-1 text-xs font-black uppercase tracking-wider text-amber-700 dark:text-amber-300 bg-amber-200/80 dark:bg-amber-900/50 px-2.5 py-0.5 rounded-full border border-amber-300 dark:border-amber-700 shadow-xs">
                        <Clock className="w-3.5 h-3.5 text-amber-600" /> Upcoming Scheduled Plan
                      </span>
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                        Paid & Confirmed
                      </span>
                    </div>
                    <h3 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white capitalize">
                      {upcomingSub.plan_name || upcomingSub.plan} Plan
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-md">
                      Next cycle scheduled to start automatically when your current plan completes.
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-mono font-extrabold text-slate-900 dark:text-white px-3 py-1 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs block">
                      ₹{upcomingSub.amount_paid || 499} Paid
                    </span>
                  </div>
                </div>

                {(() => {
                  const upcomingDays = Number(upcomingSub.duration_days) || (upcomingSub.plan === "pro" ? 60 : 30);
                  const curExpMs = sub?.expires_at ? new Date(sub.expires_at).getTime() : Date.now();
                  const rawStartMs = upcomingSub.starts_at ? new Date(upcomingSub.starts_at).getTime() : 0;
                  const effectiveStartMs = Math.max(curExpMs, rawStartMs);
                  const effectiveStartsOn = new Date(effectiveStartMs).toISOString().slice(0, 10);
                  const effectiveValidUntil = new Date(effectiveStartMs + upcomingDays * 86400000).toISOString().slice(0, 10);
                  const cycles = upcomingSub.cycle_count || Math.max(1, Math.round(upcomingDays / (upcomingSub.plan === "pro" ? 60 : 30)));

                  return (
                    <div className="mt-6 pt-5 border-t border-amber-300/40 grid grid-cols-2 sm:grid-cols-3 gap-4 text-left">
                      <div>
                        <div className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">Starts On</div>
                        <div className="font-heading font-extrabold text-base text-slate-900 dark:text-white mt-0.5">
                          {effectiveStartsOn}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">Valid Until</div>
                        <div className="font-heading font-extrabold text-base text-emerald-600 dark:text-emerald-400 mt-0.5">
                          {effectiveValidUntil}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">Duration</div>
                        <div className="font-heading font-extrabold text-base text-slate-900 dark:text-white mt-0.5">
                          {cycles > 1 ? `${upcomingDays} Days (${cycles} Cycles Stacked)` : `${upcomingDays} Days`}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Instant Activation Button */}
              <div className="mt-6 pt-5 border-t border-amber-300/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="text-[11px] text-slate-600 dark:text-slate-300 font-medium leading-tight">
                  <b>Want benefits immediately?</b> Activate now and roll over your remaining days with zero loss.
                </div>
                <Button
                  disabled={activating}
                  onClick={() => handleActivateNow(false)}
                  className="h-10 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs shadow-md active:scale-95 transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <Zap className="w-4 h-4 fill-slate-950" />
                  <span>{activating ? "Activating Plan..." : "⚡ Activate Instantly Now"}</span>
                </Button>
              </div>

            </div>
          )}

        </div>
      </div>

      {/* =========================================================
          AVAILABLE SUBSCRIPTION TIERS (UPGRADE / DOWNGRADE / RENEW)
      ========================================================= */}
      <div>
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white">Available Subscription Tiers</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Upgrade, renew, or adjust your store plan anytime.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {TIER_PLANS.map((plan) => {
            const isCurrent = currentPlanId === plan.id;
            const cardRank = PLAN_RANK[plan.id] || 0;
            const isUpgrade = cardRank > currentRank;
            const isDowngrade = cardRank < currentRank;
            const isQueuedNext = upcomingSub?.plan === plan.id;

            return (
              <div
                key={plan.id}
                className={`rounded-2xl p-5 border transition-all flex flex-col justify-between relative ${
                  plan.is_pro
                    ? "bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white border-amber-400/50 shadow-xl ring-1 ring-amber-400/20"
                    : plan.is_cafe
                    ? "bg-slate-900 text-white border-orange-500/30 shadow-xl"
                    : plan.featured 
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-2 border-blue-600 dark:border-blue-500 shadow-xl" 
                    : "bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-slate-200 dark:border-slate-800 shadow-2xs"
                }`}
              >
                {plan.featured && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-extrabold uppercase tracking-widest px-3 py-0.5 rounded-full shadow-sm whitespace-nowrap">
                    {plan.badge}
                  </div>
                )}
                {plan.is_cafe && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-orange-600 text-white text-[10px] font-black uppercase tracking-widest px-3 py-0.5 rounded-full shadow-md flex items-center gap-1 whitespace-nowrap">
                    <Sparkles className="w-3 h-3" /> Coming Soon
                  </div>
                )}
                {plan.is_pro && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 text-[10px] font-black uppercase tracking-widest px-3 py-0.5 rounded-full shadow-md flex items-center gap-1 whitespace-nowrap">
                    <Sparkles className="w-3 h-3 text-slate-950" /> Flagship Plan
                  </div>
                )}

                <div>
                  {plan.id === "pro" && (
                    <div className="mb-2 bg-slate-950 px-2.5 py-1 rounded-xl border border-slate-800 shadow-xs inline-flex items-center">
                      <img src="/kivo-pro.png" alt="Kivo Pro" className="h-5 sm:h-6 w-auto object-contain" />
                    </div>
                  )}
                  {plan.id === "premium" && (
                    <div className="mb-2 bg-slate-950 px-2.5 py-1 rounded-xl border border-slate-800 shadow-xs inline-flex items-center">
                      <img src="/kivo-premium.png" alt="Kivo Premium" className="h-5 sm:h-6 w-auto object-contain" />
                    </div>
                  )}
                  {plan.id === "cafe" && (
                    <div className="mb-2 bg-slate-950 px-2.5 py-1 rounded-xl border border-slate-800 shadow-xs inline-flex items-center">
                      <img src="/kivo-cafe.png" alt="Kivo Cafe Plan" className="h-5 sm:h-6 w-auto object-contain" />
                    </div>
                  )}
                  <div className="flex items-center justify-between mb-4">
                    <span className={`text-xs font-bold uppercase tracking-wider ${plan.is_pro ? "text-amber-300" : plan.is_cafe ? "text-orange-300" : "text-blue-600 dark:text-blue-400"}`}>
                      {plan.name}
                    </span>
                    {isCurrent ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-400/40">
                        Current Plan
                      </span>
                    ) : isQueuedNext ? (
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 shadow-xs">
                        Scheduled Next
                      </span>
                    ) : null}
                  </div>

                  <div className="flex items-baseline gap-2 mb-1 flex-wrap">
                    <span className="font-display text-3xl font-extrabold">₹{plan.price}</span>
                    {plan.originalPrice && (
                      <span className="text-sm line-through text-slate-400 font-semibold">₹{plan.originalPrice}</span>
                    )}
                    <span className={`text-xs font-medium ${plan.is_pro || plan.is_cafe ? "text-slate-300" : "text-slate-400"}`}>
                      /month
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 mb-4 flex-wrap">
                    {plan.discount && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        {plan.discount}
                      </span>
                    )}
                    {plan.offerBadge && (
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                        {plan.offerBadge}
                      </span>
                    )}
                    <span className={`text-[11px] font-medium ${plan.is_pro || plan.is_cafe ? "text-slate-300" : "text-slate-400"}`}>
                      {plan.setup > 0 ? `+ ₹${plan.setup} setup` : "Zero setup fee"}
                    </span>
                  </div>

                  <div className={`h-px w-full my-4 ${plan.is_pro || plan.is_cafe ? "bg-slate-800" : "bg-slate-100 dark:bg-slate-800"}`} />

                  <ul className="space-y-2.5 mb-6 text-xs font-medium">
                    {plan.features.map((feat, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${plan.is_pro ? "text-amber-400" : plan.is_cafe ? "text-orange-400" : "text-blue-600 dark:text-blue-400"}`} />
                        <span className={plan.is_pro || plan.is_cafe ? "text-slate-200" : "text-slate-700 dark:text-slate-300"}>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Dynamic Tier CTA Buttons */}
                <Button
                  onClick={() => nav(`/subscribe?plan=${plan.id}${isCurrent ? "&renew=1" : ""}`)}
                  className={`w-full h-11 rounded-xl font-bold text-xs shadow-xs active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    plan.is_pro
                      ? "bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-black"
                      : plan.is_cafe
                      ? "bg-orange-600 hover:bg-orange-500 text-white font-bold"
                      : isCurrent
                      ? "bg-blue-600 hover:bg-blue-500 text-white"
                      : isUpgrade
                      ? "bg-blue-600 hover:bg-blue-500 text-white"
                      : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700"
                  }`}
                >
                  {isCurrent ? (
                    <>
                      <span>Renew {plan.name} {plan.id === "pro" ? "(1+1 Mo Free)" : "(+30 Days)"}</span>
                      <RefreshCw className="w-3.5 h-3.5" />
                    </>
                  ) : plan.is_cafe ? (
                    <>
                      <span>Pre-Register {plan.name} (+2 Mo Free Pro)</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  ) : isUpgrade ? (
                    <>
                      <span>Upgrade to {plan.name}</span>
                      <ArrowUpRight className="w-4 h-4" />
                    </>
                  ) : isDowngrade ? (
                    <>
                      <span>Downgrade to {plan.name}</span>
                      <ArrowDownLeft className="w-3.5 h-3.5" />
                    </>
                  ) : (
                    <>
                      <span>Choose {plan.name}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </Button>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
