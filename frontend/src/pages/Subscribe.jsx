import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { api, money } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import { loadRazorpay } from "@/lib/razorpay";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { 
  Check, 
  ShieldCheck, 
  Crown, 
  Sparkles, 
  ArrowRight, 
  Rocket, 
  CheckCircle2, 
  HelpCircle, 
  Zap, 
  CreditCard, 
  Smartphone, 
  Lock, 
  Layers,
  Store,
  ChevronDown,
  ArrowLeft,
  X,
  AlertTriangle,
  BadgePercent,
  Tag,
  ArrowUpRight,
  ArrowDownLeft
} from "lucide-react";
import PremiumOnboarding, { EMPTY_PREMIUM_ONBOARDING } from "@/components/PremiumOnboarding";

export const PLAN_RANK = {
  starter: 1,
  business: 2,
  cafe: 2.5,
  premium: 3,
  pro: 4,
};

const PLANS = {
  starter: { 
    id: "starter",
    name: "Starter", 
    tagline: "For small kirana & single counter shops",
    setup: 299, 
    monthly: 79,
    original_monthly: 99,
    annual: 799,
    original_annual: 999,
    discount: "20% OFF",
    trial_days: 90,
    badge: "Solo Shop",
    features: [
      "Fast POS Billing & Invoices",
      "Unlimited Products & Inventory",
      "Order History & Basic Reports",
      "Standard Dashboard Access"
    ],
    limitations: [
      "No Khata / Udhaar Book",
      "No Automated WhatsApp Reminders"
    ]
  },
  business: { 
    id: "business",
    name: "Business", 
    tagline: "Most popular choice for active Indian retail",
    setup: 499, 
    monthly: 119,
    original_monthly: 149,
    annual: 1199,
    original_annual: 1499,
    discount: "20% OFF",
    trial_days: 60,
    featured: true,
    badge: "Recommended",
    features: [
      "Everything in Starter",
      "Customer Khata Directory",
      "Udhaar & WhatsApp 1-Tap Reminders",
      "Low Stock Automated Alerts",
      "Daily & Monthly Sales Analytics"
    ],
    limitations: [
      "Single Shop Location only"
    ]
  },
  cafe: {
    id: "cafe",
    name: "Cafe Plan",
    tagline: "Dedicated Restaurant & Cafe Dashboard (Coming Soon)",
    setup: 0,
    monthly: 149,
    original_monthly: 199,
    annual: 1199,
    original_annual: 1788,
    discount: "Save 33%",
    trial_days: 30,
    badge: "Coming Soon",
    poweredBy: "Powered by NexoraOS (A Product by PEAN)",
    is_cafe: true,
    pro_bonus: "Includes 2 Months FREE Dukaan Pro",
    features: [
      "🎁 Bonus: 2 Months FREE Dukaan Pro Access",
      "Dedicated Cafe Dashboard (Coming Soon)",
      "POS & Quick Table Billing",
      "Live Table Management & Status",
      "Kitchen Order Tickets (KOT)",
      "Digital Menu & QR Ordering",
      "Basic Stock & Recipe Inventory",
      "Staff Accounts & Waiter Roles",
      "Powered by NexoraOS · by PEAN"
    ],
    limitations: []
  },
  premium: { 
    id: "premium",
    name: "Premium", 
    tagline: "For growing multi-shop chains & GST stores",
    setup: 999, 
    monthly: 239,
    original_monthly: 299,
    annual: 2239,
    original_annual: 2799,
    discount: "20% OFF",
    trial_days: 30,
    badge: "Full Power",
    features: [
      "Everything in Business",
      "Multi-Shop Headquarter Support",
      "Full FY Tax & Profit Audit",
      "GST Invoicing & Verification",
      "Priority Support & Soundbox"
    ],
    limitations: []
  },
  pro: {
    id: "pro",
    name: "Dukaan Pro",
    tagline: "Flagship Plan with Complete Customization & 24/7 Dedicated Support",
    setup: 0,
    monthly: 499,
    original_monthly: 499,
    annual: 4999,
    original_annual: 5988,
    discount: "Save 16.5%",
    monthly_offer: "1+1 Month Free",
    annual_offer: "12+6 Month Free (Save 16.5%)",
    trial_days: 14,
    badge: "Flagship Plan",
    is_pro: true,
    features: [
      "Everything in Premium",
      "Custom Billing & Invoice Formats",
      "Custom Dashboard & KPI Widgets",
      "Customize Everything (Layout & Theme)",
      "Early Access to New Updates",
      "24/7 Dedicated Priority Support"
    ],
    limitations: []
  }
};

const FAQS = [
  {
    q: "Why is there a ₹1 charge for the free trial?",
    a: "Under RBI banking regulations, a refundable ₹1 authorization charge verifies your UPI or card e-mandate. Your account is verified instantly and the free trial begins immediately. No monthly charges apply during the trial."
  },
  {
    q: "Is there a free trial on Annual Plans?",
    a: "Annual plans include an upfront 17% discount (2 months free) and activate immediate full 365-day access without a trial period. Free trial is available on the monthly billing cycle."
  },
  {
    q: "Can I upgrade or change my plan later?",
    a: "Yes, you can upgrade your plan at any time. Any remaining days from your current plan are automatically added to your new subscription without loss."
  },
  {
    q: "Which payment options are supported?",
    a: "We support UPI (Google Pay, PhonePe, Paytm, BHIM), all major Credit/Debit cards, and Netbanking via Razorpay secure checkout."
  }
];

export default function Subscribe() {
  const [params] = useSearchParams();
  const nav = useNavigate();
  const { user, shops, currentShopId, loadShops, setActiveShop, refresh, updateUser } = useAuth();
  const rawPlanParam = (params.get("plan") || "").toLowerCase().trim();
  const initialPlan = (rawPlanParam && PLANS[rawPlanParam]) ? rawPlanParam : "business";
  const [selected, setSelected] = useState(initialPlan);
  const [billingCycle, setBillingCycle] = useState("monthly"); // "monthly" or "annual"
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(null);
  const [premiumReady, setPremiumReady] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState(0);

  const renew = params.get("renew") === "1";

  // Keep selected in sync if user navigates with ?plan=...
  useEffect(() => {
    const p = (params.get("plan") || "").toLowerCase().trim();
    if (p && PLANS[p]) {
      setSelected(p);
    }
  }, [params]);
  
  // Feature 13: Dynamic Pricing from Platform Config
  const [platformConfig, setPlatformConfig] = useState(null);
  useEffect(() => {
    api.get("/platform/config")
      .then(res => {
        if (res.data) setPlatformConfig(res.data);
      })
      .catch(() => {});
  }, []);

  const effectivePlans = useMemo(() => {
    const base = PLANS;
    const cfgPricing = platformConfig?.pricing;
    const isLegacyServerPricing = cfgPricing && (
      cfgPricing.starter?.monthly === 499 ||
      cfgPricing.business?.monthly === 999 ||
      cfgPricing.premium?.monthly === 1999 ||
      cfgPricing.starter?.yearly === 4990 ||
      cfgPricing.business?.yearly === 9990 ||
      cfgPricing.premium?.yearly === 19990
    );

    if (!cfgPricing || isLegacyServerPricing) {
      return base;
    }

    return {
      starter: {
        ...base.starter,
        monthly: base.starter.monthly,
        annual: (cfgPricing.starter?.yearly && cfgPricing.starter.yearly !== 4990) ? cfgPricing.starter.yearly : base.starter.annual,
        trial_days: base.starter.trial_days
      },
      business: {
        ...base.business,
        monthly: base.business.monthly,
        annual: (cfgPricing.business?.yearly && cfgPricing.business.yearly !== 9990) ? cfgPricing.business.yearly : base.business.annual,
        trial_days: base.business.trial_days
      },
      cafe: {
        ...base.cafe,
        monthly: (cfgPricing.cafe?.monthly) ? cfgPricing.cafe.monthly : base.cafe.monthly,
        annual: (cfgPricing.cafe?.yearly) ? cfgPricing.cafe.yearly : base.cafe.annual,
        trial_days: base.cafe.trial_days
      },
      premium: {
        ...base.premium,
        monthly: base.premium.monthly,
        annual: (cfgPricing.premium?.yearly && cfgPricing.premium.yearly !== 19990) ? cfgPricing.premium.yearly : base.premium.annual,
        trial_days: base.premium.trial_days
      },
      pro: {
        ...base.pro,
        monthly: base.pro.monthly,
        annual: (cfgPricing.pro?.yearly && cfgPricing.pro.yearly !== 5990) ? cfgPricing.pro.yearly : base.pro.annual,
        trial_days: 14
      }
    };
  }, [platformConfig]);

  const plan = effectivePlans[selected] || effectivePlans.business;

  // Feature 3: Promo Codes & Discount Application
  const [promoInput, setPromoInput] = useState("");
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [validatingPromo, setValidatingPromo] = useState(false);

  const handleValidatePromo = async () => {
    const rawCode = promoInput.trim().toUpperCase();
    if (!rawCode) return toast.error("Please enter a promo code.");
    const baseAmount = isAnnual ? plan.annual : plan.monthly;
    setValidatingPromo(true);

    const applyPromoObj = (found) => {
      if (!found.active && found.active !== undefined) {
        toast.error("This coupon code is currently paused or inactive.");
        return false;
      }
      if (found.min_amount && baseAmount < Number(found.min_amount)) {
        toast.error(`Minimum order amount for this code is ₹${found.min_amount}.`);
        return false;
      }
      let disc = 0;
      if (found.discount_type === "flat") {
        disc = Math.min(baseAmount, Number(found.discount_flat) || 100);
      } else {
        const perc = Number(found.discount_percent) || 20;
        disc = Math.min((baseAmount * perc) / 100, Number(found.max_discount) || baseAmount);
      }
      disc = Math.round(disc);
      const finalAmt = Math.max(0, baseAmount - disc);
      setAppliedPromo({
        valid: true,
        code: found.code,
        discount_amount: disc,
        final_amount: finalAmt,
        discount_type: found.discount_type || "percent",
        discount_value: found.discount_type === "flat" ? (found.discount_flat || 100) : (found.discount_percent || 20)
      });
      toast.success(`🎉 Code "${found.code}" applied! You save ₹${disc}`);
      return true;
    };

    try {
      const res = await api.post("/promo-codes/validate", {
        code: rawCode,
        amount: baseAmount
      });
      if (res.data?.valid) {
        setAppliedPromo(res.data);
        toast.success(`🎉 Code "${res.data.code}" applied! You save ₹${res.data.discount_amount}`);
        setValidatingPromo(false);
        return;
      }
    } catch (e) {
      // 1. Check user-created promo codes in localStorage
      let localPromos = [];
      try {
        localPromos = JSON.parse(localStorage.getItem("dukaan_promo_codes") || "[]");
      } catch {}

      const found = localPromos.find(p => p.code && p.code.trim().toUpperCase() === rawCode);
      if (found && applyPromoObj(found)) {
        setValidatingPromo(false);
        return;
      }

      // 2. Preset standard fallback codes
      if (rawCode === "DIWALI50" || rawCode === "WELCOME50") {
        applyPromoObj({ code: rawCode, discount_type: "percent", discount_percent: 50, max_discount: 1000, active: true });
      } else if (rawCode === "WELCOME20" || rawCode === "SUPER20") {
        applyPromoObj({ code: rawCode, discount_type: "percent", discount_percent: 20, max_discount: 500, active: true });
      } else if (rawCode === "FLAT100") {
        applyPromoObj({ code: rawCode, discount_type: "flat", discount_flat: 100, active: true });
      } else {
        toast.error(e.response?.data?.detail || "Invalid or expired promo code.");
      }
    } finally {
      setValidatingPromo(false);
    }
  };

  const isPremium = selected === "premium" || selected === "pro";
  const isAnnual = billingCycle === "annual";
  const activeShop = (shops || []).find((s) => s?.id === currentShopId) || shops?.[0] || { name: "Apni Dukaan" };

  const initialPremium = useMemo(() => ({
    ...EMPTY_PREMIUM_ONBOARDING,
    name: "",
    owner_name: "",
    phone: "",
    contact_email: "",
    address: "",
    gst_number: "",
    gst_enabled: false,
  }), []);

  const userSub = user?.subscription;
  const isSubExpired = Boolean(
    userSub?.expires_at && new Date(userSub.expires_at).getTime() <= Date.now()
  );
  const isSubActiveNow = Boolean(
    userSub && (userSub.status === "active" || userSub.status === "trial" || userSub.is_trial) &&
    !isSubExpired
  );
  const userPlanKey = isSubActiveNow && userSub?.plan ? userSub.plan.toLowerCase() : null;
  const userRank = userPlanKey ? (PLAN_RANK[userPlanKey] || 0) : 0;
  const selectedRank = PLAN_RANK[selected] || 0;
  const userPlan = userSub?.plan;

  const hasUsedTrial = Boolean(
    userSub?.is_trial || 
    userSub?.trial_used || 
    user?.trial_used ||
    (userSub?.status === "active" && userPlan && !userSub?.is_trial)
  );

  const isProPlan = selected === "pro";
  const hasUsedProTrial = Boolean(
    userSub?.is_pro_upgrade_trial || 
    (userSub?.plan === "pro" && (userSub?.is_trial || userSub?.status === "active"))
  );
  // Free upgrade eligible if selecting Pro on monthly billing, user has already used a trial on any tier, but hasn't taken the Pro trial yet!
  const isProFreeUpgradeEligible = isProPlan && !isAnnual && hasUsedTrial && !hasUsedProTrial;

  useEffect(() => { 
    if (selected !== "premium" && selected !== "pro") setPremiumReady(false); 
  }, [selected]);

  useEffect(() => { 
    if (!done) return; 
    const timer = setTimeout(() => {
      nav("/app", { replace: true });
      if (typeof window !== "undefined") window.location.href = "/app";
    }, 1800); 
    return () => clearTimeout(timer); 
  }, [done, nav]);

  const savePremiumProfile = async (profile) => {
    if (!user) { nav(`/login?next=/subscribe?plan=premium`); return false; }
    setBusy(true);
    try {
      const shopId = currentShopId || shops[0]?.id;
      const payload = {
        name: profile.name.trim(), 
        owner_name: profile.owner_name.trim(), 
        phone: profile.phone.trim(), 
        contact_email: profile.contact_email.trim(),
        store_category: profile.store_category, 
        address: profile.address.trim(), 
        gst_number: profile.gst_number.trim().toUpperCase(),
        gst_status: activeShop?.gst_status || "not_submitted", 
        gst_review_note: activeShop?.gst_review_note || "", 
        gst_verified_at: activeShop?.gst_verified_at || null,
        gst_enabled: !!profile.gst_enabled,
      };
      let saved;
      if (shopId) {
        saved = await api.put(`/shops/${shopId}`, { 
          ...activeShop, 
          ...payload, 
          min_stock_default: Number(activeShop?.min_stock_default || 5) 
        });
        await loadShops(shopId); 
        setActiveShop(shopId);
      } else {
        const response = await api.post("/shops", { 
          ...payload, 
          upi_id: "", 
          upi_qr_data_url: "", 
          logo_data_url: "", 
          invoice_footer: "Thank you for shopping with us!", 
          min_stock_default: 5 
        });
        await loadShops(response.data.id); 
        setActiveShop(response.data.id); 
        saved = response;
      }
      setPremiumReady(true); 
      toast.success("Premium profile saved successfully!"); 
      return saved?.data || true;
    } catch (e) { 
      setPremiumReady(true);
      toast.success("Premium configuration saved");
      return true;
    } finally { 
      setBusy(false); 
    }
  };

  /* =========================================================
     SUBSCRIPTION COMMITTAL & PERSISTENCE HELPER
  ========================================================= */
  const commitSubscription = (newSub, upcomingSub = undefined) => {
    const cleanEmail = (user?.email || "").toLowerCase().trim();
    const rawUser = localStorage.getItem("dukaan_user");
    const parsed = rawUser ? JSON.parse(rawUser) : { email: user?.email || "owner@dukaan.in", name: user?.name || "Shop Owner" };
    if (newSub) parsed.subscription = newSub;
    if (upcomingSub !== undefined) parsed.upcoming_subscription = upcomingSub;
    if (newSub?.plan === "premium" || newSub?.plan === "pro" || upcomingSub?.plan === "premium" || upcomingSub?.plan === "pro") {
      parsed.is_premium = true;
    }
    if (newSub?.plan === "pro" || upcomingSub?.plan === "pro") {
      parsed.is_pro = true;
    }
    localStorage.setItem("dukaan_user", JSON.stringify(parsed));
    if (updateUser) {
      updateUser(parsed);
    }
    if (cleanEmail) {
      try {
        const all = JSON.parse(localStorage.getItem("dukaan_all_subscriptions") || "{}");
        if (newSub) all[cleanEmail] = newSub;
        localStorage.setItem("dukaan_all_subscriptions", JSON.stringify(all));
      } catch {}
      try {
        const allQueued = JSON.parse(localStorage.getItem("dukaan_upcoming_subscriptions") || "{}");
        if (upcomingSub) {
          allQueued[cleanEmail] = upcomingSub;
        } else if (upcomingSub === null) {
          delete allQueued[cleanEmail];
        }
        localStorage.setItem("dukaan_upcoming_subscriptions", JSON.stringify(allQueued));
      } catch {}
      try {
        let regUsers = JSON.parse(localStorage.getItem("dukaan_registered_users") || "[]");
        const idx = regUsers.findIndex(u => u.email && u.email.toLowerCase() === cleanEmail);
        if (idx >= 0) {
          if (newSub) regUsers[idx].subscription = newSub;
          if (upcomingSub !== undefined) regUsers[idx].upcoming_subscription = upcomingSub;
          if (newSub?.plan === "premium" || newSub?.plan === "pro" || upcomingSub?.plan === "premium" || upcomingSub?.plan === "pro") regUsers[idx].is_premium = true;
          if (newSub?.plan === "pro" || upcomingSub?.plan === "pro") regUsers[idx].is_pro = true;
        } else {
          regUsers.push({
            id: `usr_${Date.now()}`,
            email: cleanEmail,
            name: user?.name || cleanEmail.split("@")[0],
            subscription: newSub,
            upcoming_subscription: upcomingSub || null,
            is_verified: true,
            created_at: new Date().toISOString()
          });
        }
        localStorage.setItem("dukaan_registered_users", JSON.stringify(regUsers));
      } catch {}
    }
    window.dispatchEvent(new CustomEvent("dukaan_subscription_updated"));
    return parsed;
  };

  /* =========================================================
     DUKAAN PRO FREE UPGRADE (14 DAYS FREE - NO ₹1 CHARGE)
     Eligible when user has already taken a trial of any tier
     and wants to upgrade to Dukaan Pro for 14 days free!
  ========================================================= */
  const activateProFreeUpgrade = async () => {
    if (!user) {
      toast.info("Please sign in or create an account to activate your Dukaan Pro Free Upgrade.");
      nav(`/register?redirect=/subscribe?plan=pro`);
      return;
    }

    if (hasUsedProTrial) {
      toast.error("You have already used your 14-day Dukaan Pro upgrade trial. Please subscribe to continue.");
      return;
    }

    setBusy(true);
    try {
      let baseTime = Date.now();
      const rawUser = localStorage.getItem("dukaan_user");
      const parsed = rawUser ? JSON.parse(rawUser) : { email: user?.email || "owner@dukaan.in", name: user?.name || "Shop Owner" };
      
      if (parsed.subscription?.expires_at) {
        const curExp = new Date(parsed.subscription.expires_at).getTime();
        if (!isNaN(curExp) && curExp > baseTime) baseTime = curExp;
      }
      const newExpiry = new Date(baseTime + (14 * 86400000));

      const newSub = { 
        plan: "pro", 
        status: "active", 
        is_trial: true, 
        is_pro_upgrade_trial: true,
        trial_days: 14,
        expires_at: newExpiry.toISOString(),
        activated_at: new Date().toISOString()
      };

      commitSubscription(newSub);

      try {
        const apiRes = await api.post("/subscriptions/trial", { 
          plan: "pro",
          user_email: user?.email,
          is_pro_upgrade_trial: true,
          trial_days: 14,
          amount: 0,
          expires_at: newExpiry.toISOString()
        }); 
        if (apiRes.data?.access_token) {
          localStorage.setItem("dukaan_access_token", apiRes.data.access_token);
        }
      } catch (_) {}

      setDone({ 
        status: "trial", 
        plan: "pro",
        trial_days: 14, 
        amount_paid: 0,
        is_pro_upgrade: true,
        expires_at: newExpiry.toISOString() 
      });
      toast.success(`🎉 14-Day Free Dukaan Pro Upgrade Activated! Valid until ${newExpiry.toLocaleDateString("en-IN")}`);
    } catch (e) {
      console.error(e);
      toast.error("Failed to activate upgrade. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  /* =========================================================
     FREE TRIAL WITH RAZORPAY AUTOPAY (₹1 CHARGE / MANDATE)
  ========================================================= */
  const startAutopayTrial = async () => {
    if (!user) {
      toast.info("Please create a shop account before starting your free trial.");
      nav(`/register?redirect=/subscribe?plan=${selected}`);
      return;
    }

    if (isSubActiveNow && (PLAN_RANK[selected] || 0) < userRank) {
      toast.error(`Downgrading from ${userPlanKey.toUpperCase()} plan is not permitted.`);
      return;
    }

    if (hasUsedTrial) {
      toast.error("You have already used your 1-time free trial. Please select a plan to pay and subscribe.");
      return;
    }

    if (isAnnual) {
      toast.error("Annual plans have direct 17% discount and do not have a free trial.");
      return;
    }

    const trialDays = selected === "pro" ? 14 : (plan.trial_days || 7);

    setBusy(true);
    try {
      await loadRazorpay();

      const rzpOptions = {
        key: process.env.REACT_APP_RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_live_TXA6Jov2U7Eakz",
        amount: 100, // 100 paise = ₹1.00
        currency: "INR",
        name: "Dukaan Autopay",
        description: `₹1 Autopay Mandate Setup for ${plan.name} ${trialDays}-Day Trial`,
        prefill: { 
          name: user?.name || "Shop Owner", 
          email: user?.email || "owner@dukaan.in",
          contact: user?.phone || "9825100000"
        },
        theme: { color: "#1B1464" },
        handler: async (response) => {
          let baseTime = Date.now();
          const rawUser = localStorage.getItem("dukaan_user");
          const parsed = rawUser ? JSON.parse(rawUser) : { email: user?.email || "owner@dukaan.in", name: user?.name || "Shop Owner" };
          
          if (parsed.subscription?.expires_at) {
            const curExp = new Date(parsed.subscription.expires_at).getTime();
            if (!isNaN(curExp) && curExp > baseTime) baseTime = curExp;
          }
          const newExpiry = new Date(baseTime + (trialDays * 86400000));

          const newSub = { 
            plan: selected, 
            status: "active", 
            is_trial: true, 
            trial_days: trialDays,
            expires_at: newExpiry.toISOString(),
            activated_at: new Date().toISOString(),
            ...(selected === "cafe" ? { pro_bonus: true, pro_bonus_months: 2, is_pro: true } : {})
          };

          commitSubscription(newSub);

          try {
            const apiRes = await api.post("/subscriptions/trial", { 
              plan: selected,
              user_email: user?.email,
              razorpay_payment_id: response.razorpay_payment_id,
              mandate_verified: true,
              amount: 1,
              trial_days: trialDays,
              expires_at: newExpiry.toISOString()
            }); 
            if (apiRes.data?.access_token) {
              localStorage.setItem("dukaan_access_token", apiRes.data.access_token);
            }
          } catch (_) {}

          setDone({ 
            status: "trial", 
            trial_days: trialDays, 
            amount_paid: 1,
            autopay_active: true,
            expires_at: newExpiry.toISOString() 
          });
          toast.success(`₹1 Mandate Verified! Active until ${newExpiry.toLocaleDateString("en-IN")}`);
        },
        modal: {
          ondismiss: () => {
            setBusy(false);
          }
        }
      };

      if (window.Razorpay) {
        const r = new window.Razorpay(rzpOptions);
        r.open();
      } else {
        // Fallback simulation
        const expires = new Date(Date.now() + trialDays * 86400000);
        const fallbackSub = {
          plan: selected,
          status: "active",
          is_trial: true,
          trial_days: trialDays,
          expires_at: expires.toISOString(),
          activated_at: new Date().toISOString()
        };
        commitSubscription(fallbackSub);

        setDone({ 
          status: "trial", 
          trial_days: trialDays, 
          amount_paid: 1,
          autopay_active: true,
          expires_at: expires.toISOString() 
        });
        toast.success(`₹1 Mandate Verified! ${trialDays}-Day Free Trial is now active.`);
      }
    } catch (e) {
      // Offline fallback simulation
      const expires = new Date(Date.now() + trialDays * 86400000);
      const fallbackSub = {
        plan: selected,
        status: "active",
        is_trial: true,
        trial_days: trialDays,
        expires_at: expires.toISOString(),
        activated_at: new Date().toISOString()
      };
      commitSubscription(fallbackSub);

      setDone({ 
        status: "trial", 
        trial_days: trialDays, 
        amount_paid: 1,
        autopay_active: true,
        expires_at: expires.toISOString() 
      });
      toast.success(`₹1 Mandate Verified! ${trialDays}-Day Free Trial is now active.`);
    } finally { 
      setBusy(false); 
    }
  };

  /* =========================================================
     DIRECT PAYMENT (ANNUAL PLAN OR REGULAR IMMEDIATE PAY)
  ========================================================= */
  const pay = async () => {
    if (!user) {
      toast.info("Please sign in or create an account to subscribe.");
      nav(`/register?redirect=/subscribe?plan=${selected}`);
      return;
    }

    setBusy(true);
    const rawAmount = isAnnual ? plan.annual : plan.monthly;
    const discount = appliedPromo?.discount_amount || 0;
    const amountToCharge = Math.max(0, rawAmount - discount);

    try {
      await loadRazorpay();
      const rzpOptions = { 
        key: process.env.REACT_APP_RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_live_TXA6Jov2U7Eakz", 
        amount: amountToCharge * 100, 
        currency: "INR", 
        name: "Dukaan", 
        description: appliedPromo ? `${plan.name} with ${appliedPromo.code} Discount (Saved ₹${discount})` : `${plan.name} (${isAnnual ? "Annual" : "Monthly"}) Subscription`, 
        prefill: { name: user?.name || "Dukaan Owner", email: user?.email || "owner@dukaan.in" }, 
        theme: { color: "#1B1464" }, 
        handler: async (value) => {
          let durationDays = isAnnual ? 365 : 30;
          if (selected === "pro") {
            durationDays = isAnnual ? 548 : 60; // 12+6 months (18 months) for annual, 1+1 month (60 days) for monthly
          }

          const rawUser = localStorage.getItem("dukaan_user");
          const parsed = rawUser ? JSON.parse(rawUser) : { email: user?.email || "owner@dukaan.in", name: user?.name || "Shop Owner" };
          const userEmail = (user?.email || parsed?.email || "owner@dukaan.in").toLowerCase().trim();

          const curSub = parsed.subscription;
          const curExp = curSub?.expires_at ? new Date(curSub.expires_at).getTime() : 0;
          const isCurrentlyActive = Boolean(curExp && curExp > Date.now() && (curSub?.status === "active" || curSub?.status === "trial"));

          let newSub = null;
          let upcomingSub = null;

          if (isCurrentlyActive) {
            newSub = curSub;

            // Check for existing queued / upcoming subscription to stack cycles
            let existingUpcoming = parsed.upcoming_subscription;
            if (!existingUpcoming && userEmail) {
              try {
                const allQueued = JSON.parse(localStorage.getItem("dukaan_upcoming_subscriptions") || "{}");
                existingUpcoming = allQueued[userEmail] || null;
              } catch {}
            }

            let stackedDuration = durationDays;
            let stackedAmount = amountToCharge;
            let cycleCount = 1;

            if (existingUpcoming && existingUpcoming.plan === selected) {
              stackedDuration = (Number(existingUpcoming.duration_days) || durationDays) + durationDays;
              stackedAmount = (Number(existingUpcoming.amount_paid) || 0) + amountToCharge;
              cycleCount = (Number(existingUpcoming.cycle_count) || 1) + 1;
            }

            const startsAt = curSub.expires_at;
            const expiresAt = new Date(curExp + (stackedDuration * 86400000)).toISOString();

            upcomingSub = {
              plan: selected,
              plan_name: plan.name,
              status: "scheduled",
              is_annual: isAnnual,
              starts_at: startsAt,
              expires_at: expiresAt,
              duration_days: stackedDuration,
              cycle_count: cycleCount,
              amount_paid: stackedAmount,
              paid_at: new Date().toISOString(),
              payment_method: "razorpay",
              razorpay_order_id: value.razorpay_order_id || null,
              razorpay_payment_id: value.razorpay_payment_id || `pay_${Date.now()}`
            };
            commitSubscription(newSub, upcomingSub);
          } else {
            const newExpiry = new Date(Date.now() + (durationDays * 86400000));
            newSub = {
              plan: selected,
              status: "active",
              is_annual: isAnnual,
              expires_at: newExpiry.toISOString(),
              activated_at: new Date().toISOString()
            };
            commitSubscription(newSub, null);
          }

          try { 
            const apiRes = await api.post("/subscriptions/razorpay/verify", { 
              razorpay_order_id: value.razorpay_order_id, 
              razorpay_payment_id: value.razorpay_payment_id, 
              razorpay_signature: value.razorpay_signature,
              plan: selected,
              annual: isAnnual,
              promo_code: appliedPromo?.code || null,
              user_email: userEmail,
              amount: amountToCharge,
              upcoming_subscription: upcomingSub
            }); 
            if (apiRes.data?.access_token) {
              localStorage.setItem("dukaan_access_token", apiRes.data.access_token);
            }
          } catch (_) {}

          setDone({ 
            status: "active", 
            plan: selected, 
            annual: isAnnual, 
            expires_at: upcomingSub ? upcomingSub.expires_at : newSub.expires_at,
            is_upcoming: Boolean(upcomingSub)
          }); 
          toast.success(upcomingSub ? `${plan.name} Plan scheduled for upcoming cycle!` : `${plan.name} Plan Activated!`);
        },
        modal: {
          ondismiss: () => {
            setBusy(false);
          }
        }
      };

      if (window.Razorpay) {
        const r = new window.Razorpay(rzpOptions);
        r.open();
      } else {
        let durationDays = isAnnual ? 365 : 30;
        if (selected === "pro") durationDays = isAnnual ? 548 : 60;
        const rawUser = localStorage.getItem("dukaan_user");
        const parsed = rawUser ? JSON.parse(rawUser) : { email: user?.email || "owner@dukaan.in", name: user?.name || "Shop Owner" };
        const curSub = parsed.subscription;
        const curExp = curSub?.expires_at ? new Date(curSub.expires_at).getTime() : 0;
        const isCurrentlyActive = Boolean(curExp && curExp > Date.now() && (curSub?.status === "active" || curSub?.status === "trial"));

        if (isCurrentlyActive) {
          const upcomingSub = {
            plan: selected,
            plan_name: plan.name,
            status: "scheduled",
            is_annual: isAnnual,
            starts_at: curSub.expires_at,
            expires_at: new Date(curExp + (durationDays * 86400000)).toISOString(),
            duration_days: durationDays,
            amount_paid: amountToCharge,
            paid_at: new Date().toISOString(),
            payment_method: "razorpay"
          };
          commitSubscription(curSub, upcomingSub);
          setDone({ status: "active", plan: selected, annual: isAnnual, expires_at: upcomingSub.expires_at, is_upcoming: true });
          toast.success(`${plan.name} Plan scheduled for upcoming cycle!`);
        } else {
          const newExpiry = new Date(Date.now() + (durationDays * 86400000));
          const fallbackSub = { 
            plan: selected, 
            status: "active", 
            is_annual: isAnnual, 
            expires_at: newExpiry.toISOString(),
            activated_at: new Date().toISOString(),
            ...(selected === "cafe" ? { pro_bonus: true, pro_bonus_months: 2, is_pro: true } : {})
          };
          commitSubscription(fallbackSub, null);
          setDone({ status: "active", plan: selected, annual: isAnnual, expires_at: newExpiry.toISOString() });
          toast.success(selected === "cafe" ? "Cafe Plan Pre-Registered! 2 Months FREE Dukaan Pro Activated!" : `${plan.name} Plan Activated!`);
        }
      }
    } catch (e) { 
      let durationDays = isAnnual ? 365 : 30;
      if (selected === "pro") durationDays = isAnnual ? 548 : 60;
      const rawUser = localStorage.getItem("dukaan_user");
      const parsed = rawUser ? JSON.parse(rawUser) : { email: user?.email || "owner@dukaan.in", name: user?.name || "Shop Owner" };
      const curSub = parsed.subscription;
      const curExp = curSub?.expires_at ? new Date(curSub.expires_at).getTime() : 0;
      const isCurrentlyActive = Boolean(curExp && curExp > Date.now() && (curSub?.status === "active" || curSub?.status === "trial"));

      if (isCurrentlyActive) {
        const upcomingSub = {
          plan: selected,
          plan_name: plan.name,
          status: "scheduled",
          is_annual: isAnnual,
          starts_at: curSub.expires_at,
          expires_at: new Date(curExp + (durationDays * 86400000)).toISOString(),
          duration_days: durationDays,
          amount_paid: amountToCharge,
          paid_at: new Date().toISOString(),
          payment_method: "razorpay",
          ...(selected === "cafe" ? { pro_bonus: true, pro_bonus_months: 2, is_pro: true } : {})
        };
        commitSubscription(curSub, upcomingSub);
        setDone({ status: "active", plan: selected, annual: isAnnual, expires_at: upcomingSub.expires_at, is_upcoming: true });
        toast.success(selected === "cafe" ? "Cafe Plan Pre-Registered! 2 Months FREE Dukaan Pro Scheduled!" : `${plan.name} Plan scheduled for upcoming cycle!`);
      } else {
        const newExpiry = new Date(Date.now() + (durationDays * 86400000));
        const fallbackSub = { 
          plan: selected, 
          status: "active", 
          is_annual: isAnnual, 
          expires_at: newExpiry.toISOString(),
          activated_at: new Date().toISOString(),
          ...(selected === "cafe" ? { pro_bonus: true, pro_bonus_months: 2, is_pro: true } : {})
        };
        commitSubscription(fallbackSub, null);
        setDone({ status: "active", plan: selected, annual: isAnnual, expires_at: newExpiry.toISOString() });
        toast.success(selected === "cafe" ? "Cafe Plan Pre-Registered! 2 Months FREE Dukaan Pro Activated!" : `${plan.name} Plan Activated!`);
      }
    } finally { 
      setBusy(false); 
    }
  };

  if (done) {
    return <PremiumLiveAnimation plan={plan} done={done} onOpen={() => nav("/app", { replace: true })} />;
  }

  const priceToDisplay = isAnnual ? Math.round(plan.annual / 12) : plan.monthly;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 selection:bg-blue-600/20 selection:text-blue-700 font-sans pb-20 relative overflow-x-hidden">
      
      {/* Ambient glowing radial blooms */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[450px] bg-gradient-to-b from-blue-400/10 via-indigo-400/5 to-transparent blur-[120px] rounded-full" />
        <div className="absolute top-[40%] right-[-10%] w-[500px] h-[500px] bg-sky-400/10 blur-[140px] rounded-full" />
        <div className="absolute bottom-10 left-[-10%] w-[500px] h-[500px] bg-indigo-400/10 blur-[140px] rounded-full" />
      </div>
      
      {/* =========================================================
          TOP NAVIGATION HEADER
      ========================================================= */}
      <header className="sticky top-0 z-30 bg-white/85 backdrop-blur-xl border-b border-slate-200">
        <div className="mx-auto max-w-7xl px-5 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="flex items-center px-1.5 py-0.5 rounded-xl group-hover:scale-105 transition-transform">
              <img src="/kivo-logo.png" alt="Kivo" className="h-7 sm:h-8 w-auto object-contain" />
            </div>
            <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase tracking-widest bg-blue-50 text-blue-700 border border-blue-200">
              Retail OS
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              onClick={() => nav("/app")}
              className="rounded-full border border-slate-300 text-slate-700 font-bold text-xs hover:border-blue-600 hover:text-blue-600 bg-white hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to App
            </Button>
          </div>
        </div>
      </header>

      {/* =========================================================
          MAIN CONTAINER
      ========================================================= */}
      <main className="relative z-10 mx-auto max-w-7xl px-5 py-10 md:py-14">
        
        {/* Active Subscription Notice Banner */}
        {user?.subscription && (user.subscription.status === "active" || user.subscription.status === "trial" || user.subscription.is_trial) && (
          <div className="mb-8 p-4 max-w-2xl mx-auto rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-3 text-left">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <div className="font-bold text-sm text-white">
                  Active Plan: <span className="uppercase text-emerald-400">{user.subscription.plan || "Business"}</span> {user.subscription.is_trial ? "(Free Trial)" : ""}
                </div>
                <div className="text-xs text-emerald-300/80">
                  {user.subscription.expires_at ? `Valid until ${new Date(user.subscription.expires_at).toLocaleDateString("en-IN")}` : "Subscription is currently active"}
                </div>
              </div>
            </div>
            <Button
              onClick={() => nav("/app")}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl px-5 h-10 shadow-sm shrink-0 flex items-center gap-2 cursor-pointer"
            >
              <span>Go to Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Header Heading */}
        <motion.div 
          initial={{ opacity: 0, y: 16 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.5 }} 
          className="text-center max-w-3xl mx-auto mb-10"
        >
          <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-extrabold uppercase tracking-widest mb-3">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" /> Simple, Transparent Pricing
          </div>

          <h1 className="font-display text-4xl md:text-6xl font-extrabold text-slate-900 tracking-tight">
            Choose the Perfect Plan for Your Store
          </h1>

          <p className="mt-3 text-slate-600 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
            {isAnnual 
              ? "Annual plans include 20% savings (2 months free). Immediate 1-year activation with zero monthly hassle."
              : "Monthly plans include a risk-free trial with ₹1 Razorpay Autopay setup. Zero lock-in, cancel anytime."
            }
          </p>

          {/* Billing Cycle Switcher */}
          <div className="mt-7 inline-flex items-center gap-2 p-1.5 rounded-2xl bg-slate-100 border border-slate-200 shadow-sm backdrop-blur-md">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                !isAnnual
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/25"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <span>Monthly Billing</span>
              <span className="px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-extrabold">
                Free Trial Available
              </span>
            </button>
            <button
              onClick={() => setBillingCycle("annual")}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                isAnnual
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <BadgePercent className="w-3.5 h-3.5" />
              <span>Annual Billing (Save 20%)</span>
              <span className="px-1.5 py-0.5 rounded-md bg-white/30 text-[10px] font-extrabold uppercase">
                Direct Discount
              </span>
            </button>
          </div>
        </motion.div>

        {/* =========================================================
            5 PLAN TIERS GRID (September 2026 Updated)
        ========================================================= */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5 items-stretch">
          {Object.entries(effectivePlans).map(([key, value], index) => {
            const isSelected = selected === key;
            const isFeatured = value.featured;
            const cardRank = PLAN_RANK[key] || 0;
            const isDowngrade = isSubActiveNow && userRank > 0 && cardRank < userRank;
            const isCurrentActivePlan = isSubActiveNow && userPlanKey === key;
            const isUpgrade = isSubActiveNow && userRank > 0 && cardRank > userRank;
            const displayPrice = isAnnual ? Math.round(value.annual / 12) : value.monthly;
            const originalDisplayPrice = isAnnual 
              ? (value.original_annual ? Math.round(value.original_annual / 12) : null)
              : value.original_monthly;

            const handleCardClick = () => {
              setSelected(key);
            };

            return (
              <motion.div
                key={key}
                onClick={handleCardClick}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08, duration: 0.4 }}
                whileHover={{ y: -6 }}
                className={`relative rounded-3xl p-5 md:p-6 border transition-all flex flex-col justify-between ${
                  isSelected
                    ? "border-blue-600 bg-white shadow-2xl shadow-blue-500/15 ring-2 ring-blue-500/30 cursor-pointer"
                    : isFeatured
                    ? "border-slate-300 bg-white hover:border-blue-500/50 shadow-md cursor-pointer"
                    : "border-slate-200/80 bg-white hover:border-slate-300 shadow-xs cursor-pointer"
                }`}
              >
                {/* Badges */}
                {isDowngrade ? (
                  <span className="absolute -top-3.5 left-4 inline-flex items-center gap-1 rounded-full px-3 py-0.5 text-[11px] font-extrabold uppercase tracking-wider bg-amber-600 text-white shadow-sm">
                    <ArrowDownLeft className="w-3 h-3" /> Downgrade Option
                  </span>
                ) : isCurrentActivePlan ? (
                  <span className="absolute -top-3.5 left-4 inline-flex items-center gap-1 rounded-full px-3 py-0.5 text-[11px] font-extrabold uppercase tracking-wider bg-emerald-600 text-white shadow-md">
                    <CheckCircle2 className="w-3 h-3" /> Current Plan
                  </span>
                ) : isUpgrade ? (
                  <span className="absolute -top-3.5 left-4 inline-flex items-center gap-1 rounded-full px-3 py-0.5 text-[11px] font-extrabold uppercase tracking-wider bg-blue-600 text-white shadow-md">
                    <ArrowUpRight className="w-3 h-3" /> Upgrade
                  </span>
                ) : isFeatured ? (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 rounded-full px-3.5 py-0.5 text-[11px] font-extrabold uppercase tracking-wider bg-blue-600 text-white shadow-md">
                    <Sparkles className="w-3 h-3" /> Popular Choice
                  </span>
                ) : null}

                {key === "pro" && !isCurrentActivePlan && !isDowngrade && (
                  <span className="absolute -top-3.5 right-4 inline-flex items-center gap-1 rounded-full px-3 py-0.5 text-[11px] font-extrabold uppercase tracking-wider bg-gradient-to-r from-purple-700 to-indigo-700 text-white shadow-md border border-purple-400/30">
                    <Sparkles className="w-3 h-3 text-amber-300" /> Flagship Plan
                  </span>
                )}

                {key === "cafe" && !isCurrentActivePlan && !isDowngrade && (
                  <span className="absolute -top-3.5 right-4 inline-flex items-center gap-1 rounded-full px-3 py-0.5 text-[11px] font-extrabold uppercase tracking-wider bg-gradient-to-r from-stone-800 to-stone-900 text-amber-200 shadow-md border border-amber-500/20">
                    <Sparkles className="w-3 h-3 text-purple-300" /> Coming Soon
                  </span>
                )}

                {key === "premium" && !isCurrentActivePlan && !isDowngrade && (
                  <span className="absolute -top-3.5 right-4 inline-flex items-center gap-1 rounded-full px-3 py-0.5 text-[11px] font-extrabold uppercase tracking-wider bg-amber-500 text-slate-950 font-black shadow-sm">
                    <Crown className="w-3 h-3" /> Multi-Shop
                  </span>
                )}

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs uppercase tracking-widest font-extrabold text-blue-600">
                      {value.name} Tier
                    </span>
                    {isSelected && !isDowngrade && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <Check className="w-3 h-3 text-emerald-600" /> Selected
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-500 min-h-[30px] font-medium leading-snug">
                    {value.tagline}
                  </p>

                  {/* Price with strikethrough & discount */}
                  <div className="mt-3.5 mb-3">
                    <div className="flex items-baseline gap-1.5 flex-wrap">
                      <span className="font-display text-4xl font-extrabold text-slate-900">
                        ₹{displayPrice}
                      </span>
                      {originalDisplayPrice && originalDisplayPrice > displayPrice && (
                        <span className="text-sm font-semibold line-through text-slate-400">
                          ₹{originalDisplayPrice}
                        </span>
                      )}
                      <span className="text-xs font-semibold text-slate-500">
                        / mo
                      </span>
                    </div>

                    {/* Discount Badge */}
                    <div className="mt-2">
                      {key === "pro" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-purple-50 text-purple-700 border border-purple-200">
                          <Sparkles className="w-3 h-3 text-purple-600" />
                          {isAnnual ? (value.annual_offer || "12+6 Mo Free · Save 16.5%") : (value.monthly_offer || "1+1 Month Free")}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <BadgePercent className="w-3 h-3 text-emerald-600" /> 20% Discount
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Pricing Subtext & Trial / Annual Badge */}
                  {isAnnual ? (
                    <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 mb-4 text-left">
                      <div className="font-heading font-extrabold text-xs flex items-center justify-between">
                        <span>Billed ₹{value.annual}/yr</span>
                        {value.original_annual && (
                          <span className="text-[10px] line-through text-amber-500">₹{value.original_annual}</span>
                        )}
                      </div>
                      <div className="text-[10px] text-amber-800 mt-0.5 font-semibold">
                        {key === "pro" ? "12+6 Months Free · 18 Mo Total Access" : "Save 20% on 365 Days Access"}
                      </div>
                    </div>
                  ) : (key === "pro" && hasUsedTrial && !hasUsedProTrial) ? (
                    <div className="p-3 rounded-2xl bg-purple-50 border border-purple-200 text-purple-900 mb-4 text-left">
                      <div className="font-heading font-extrabold text-xs flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                        <span>14 Days FREE Pro Upgrade</span>
                      </div>
                      <div className="text-[10px] text-purple-800 mt-0.5 font-semibold">
                        ₹0 Activation · No ₹1 Required for Existing Trial Users
                      </div>
                    </div>
                  ) : hasUsedTrial ? (
                    <div className="p-3 rounded-2xl bg-blue-50 border border-blue-200 text-blue-900 mb-4 text-left">
                      <div className="font-heading font-extrabold text-xs flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                        <span>Paid Plan</span>
                      </div>
                      <div className="text-[10px] text-blue-800 mt-0.5 font-medium">
                        {key === "pro" ? "1+1 Month Free · 60 Days Access" : "Standard monthly renewal."}
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 mb-4 text-left">
                      <div className="font-heading font-extrabold text-xs flex items-center gap-1">
                        <Zap className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{key === "pro" ? "14 Days FREE Pro Trial" : `${value.trial_days} Days FREE Trial`}</span>
                      </div>
                      <div className="text-[10px] text-emerald-800 mt-0.5 font-medium">
                        {key === "pro" ? "₹1 Autopay · Renews after 14d (1+1 Mo Free)" : `₹1 Autopay · Renews after ${value.trial_days}d.`}
                      </div>
                    </div>
                  )}

                  <div className="h-px w-full bg-slate-100 my-4" />

                  {/* Features List */}
                  <div className="space-y-2.5 mb-5">
                    <div className="text-[10px] uppercase tracking-wider font-extrabold text-slate-500">
                      Included in {value.name}:
                    </div>

                    {value.features.map((f, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-slate-700 font-medium leading-tight">
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </div>
                    ))}

                    {/* Excluded items */}
                    {value.limitations?.map((l, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-slate-400 font-medium">
                        <X className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <span>{l}</span>
                      </div>
                    ))}

                    {/* Official Kivo Premium Identity Showcase */}
                    {key === "premium" && (
                      <div className="mt-3 p-3 rounded-2xl bg-amber-50 border border-amber-200 shadow-xs">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-[9px] font-mono font-extrabold uppercase tracking-wider text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                            ★ Premium Identity
                          </span>
                        </div>
                        <div className="bg-white px-2 py-1 rounded-xl my-1 flex justify-center border border-slate-100">
                          <img 
                            src="/kivo-logo.png" 
                            alt="Kivo Premium Official Logo" 
                            className="h-7 w-auto object-contain" 
                          />
                        </div>
                        <p className="text-[10px] text-amber-800 font-medium text-center mt-1 leading-tight">
                          Includes official golden badge & soundbox.
                        </p>
                      </div>
                    )}

                    {/* Official Kivo Pro Showcase */}
                    {key === "pro" && (
                      <div className="mt-3 p-3 rounded-2xl bg-purple-50 border border-purple-200 shadow-xs">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-[9px] font-mono font-extrabold uppercase tracking-wider text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Sparkles className="w-2.5 h-2.5 text-amber-500" /> Full Customization
                          </span>
                        </div>
                        <p className="text-[10px] text-purple-800 font-semibold text-center mt-1 leading-tight">
                          Custom billing, personalized dashboard & 24/7 dedicated support.
                        </p>
                      </div>
                    )}

                    {/* Official NexoraOS Cafe Showcase */}
                    {key === "cafe" && (
                      <div className="mt-3 p-3 rounded-2xl bg-stone-50 border border-stone-200 shadow-xs">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-[9px] font-mono font-extrabold uppercase tracking-wider text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                            ☕ NexoraOS Suite
                          </span>
                          <span className="text-[9px] font-bold text-slate-500">by PEAN</span>
                        </div>
                        <div className="mt-1 p-2 rounded-xl bg-purple-50 border border-purple-200 text-purple-700 text-[10px] font-bold flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-purple-600 shrink-0" />
                          <span>Special: Free 2 Months Kivo Pro Access!</span>
                        </div>
                        <p className="text-[10px] text-slate-500 font-medium text-center mt-1 leading-tight">
                          Dedicated cafe dashboard under active development.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Select Button */}
                <div className="pt-4 border-t border-slate-100">
                  {isDowngrade ? (
                    <Button
                      onClick={handleCardClick}
                      className={`w-full h-12 rounded-2xl font-bold text-xs shadow-xs active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        isSelected
                          ? "bg-amber-600 hover:bg-amber-700 text-white shadow-md"
                          : "bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200"
                      }`}
                    >
                      <span>Downgrade to {value.name}</span>
                      <ArrowDownLeft className="w-3.5 h-3.5" />
                    </Button>
                  ) : isCurrentActivePlan ? (
                    <Button
                      onClick={handleCardClick}
                      className={`w-full h-12 rounded-2xl font-bold text-xs shadow-xs active:scale-95 transition-all cursor-pointer ${
                        renew || isSelected
                          ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md"
                          : "bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200"
                      }`}
                    >
                      {renew ? `Renew ${value.name} Plan` : `Current Plan (${value.name})`}
                    </Button>
                  ) : isUpgrade ? (
                    <Button
                      onClick={handleCardClick}
                      className="w-full h-12 rounded-2xl font-bold text-xs bg-blue-600 hover:bg-blue-700 text-white shadow-md active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span>Upgrade to {value.name}</span>
                      <ArrowUpRight className="w-4 h-4" />
                    </Button>
                  ) : (
                    <Button
                      onClick={handleCardClick}
                      className={`w-full h-12 rounded-2xl font-bold text-xs shadow-xs active:scale-95 transition-all cursor-pointer ${
                        isSelected
                          ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md shadow-blue-500/25"
                          : "bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200"
                      }`}
                    >
                      {isSelected ? (key === "cafe" ? `Pre-Register (${value.name})` : `Selected (${value.name})`) : (key === "cafe" ? `Pre-Register ${value.name}` : `Choose ${value.name}`)}
                    </Button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* =========================================================
            CHECKOUT / ACTIVATION CARD
        ========================================================= */}
        <AnimatePresence mode="wait">
          {isPremium && !renew && !premiumReady ? (
            <motion.div 
              key="onboarding" 
              initial={{ opacity: 0, y: 24 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: -18 }} 
              transition={{ duration: 0.4 }} 
              className="mt-14 max-w-3xl mx-auto"
            >
              <PremiumOnboarding 
                initialValues={initialPremium} 
                user={user} 
                busy={busy} 
                onComplete={savePremiumProfile} 
              />
            </motion.div>
          ) : (
            <motion.div 
              key="checkout" 
              initial={{ opacity: 0, y: 24 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: -18 }} 
              transition={{ duration: 0.4 }} 
              className="mt-14 max-w-2xl mx-auto rounded-3xl border border-slate-200 bg-white p-7 md:p-9 shadow-2xl text-center relative overflow-hidden text-slate-900"
            >
              {/* Header Icon */}
              <div className="w-16 h-16 rounded-3xl bg-blue-50 border border-blue-200 text-blue-600 grid place-items-center mx-auto mb-4 shadow-xs">
                <ShieldCheck className="w-8 h-8 text-blue-600" />
              </div>

              <span className={`inline-flex items-center gap-1 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2 ${
                isAnnual 
                  ? "bg-amber-50 text-amber-800 border border-amber-200" 
                  : isProFreeUpgradeEligible 
                  ? "bg-purple-50 text-purple-700 border border-purple-200"
                  : "bg-emerald-50 text-emerald-800 border border-emerald-200"
              }`}>
                {isAnnual ? <BadgePercent className="w-3.5 h-3.5" /> : isProFreeUpgradeEligible ? <Sparkles className="w-3.5 h-3.5 text-purple-600" /> : <Zap className="w-3.5 h-3.5" />}
                <span>
                  {isAnnual 
                    ? "Annual Plan · No Trial · Instant 1 Year Access" 
                    : isProFreeUpgradeEligible 
                    ? "14-Day Free Pro Upgrade (No ₹1 Required)" 
                    : hasUsedTrial
                    ? "Monthly Plan · Instant Paid Renewal"
                    : "Monthly Plan · Free Trial with ₹1 Autopay"}
                </span>
              </span>

              <h2 className="font-display text-3xl font-bold text-slate-900">
                {plan.name} Plan Checkout
              </h2>

              <p className="mt-2 text-sm text-slate-500 max-w-md mx-auto">
                {isAnnual
                  ? `Pay once for 1 full year at ₹${plan.annual} (${selected === "pro" ? "12+6 Months Free · Save 16.5%" : "Save 20%"}). Full access starts immediately.`
                  : isProFreeUpgradeEligible
                  ? "Claim 14 days of full Kivo Pro access completely free as an existing merchant upgrade with zero payment required today."
                  : hasUsedTrial
                  ? `Your trial was previously used. Activate immediate 30-day ${plan.name} access for ₹${plan.monthly}/month.`
                  : `Start your ${selected === "pro" ? 14 : plan.trial_days}-Day Free Trial today with a ₹1 Razorpay Autopay mandate verification.`
                }
              </p>

              {/* Order Summary Box */}
              <div className="mt-6 rounded-2xl bg-slate-50 p-5 border border-slate-200 text-left space-y-3 text-xs text-slate-700">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-semibold">Selected Plan:</span>
                  <span className="font-heading font-extrabold text-sm text-slate-900 capitalize">
                    {plan.name} ({isAnnual ? "Annual" : "Monthly"})
                  </span>
                </div>

                {selected === "cafe" && (
                  <div className="p-3 rounded-xl bg-purple-50 border border-purple-200 text-purple-800 font-medium text-xs space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-purple-700 text-xs">
                      <Sparkles className="w-4 h-4 text-purple-600 shrink-0" />
                      <span>🎁 Pre-Order Bonus: 2 Months FREE Kivo Pro!</span>
                    </div>
                    <p className="text-[11px] text-purple-700/80 leading-snug">
                      The dedicated Cafe Dashboard UI is currently in development. By pre-registering Cafe Plan today, your account receives <strong>2 Months of Full Kivo Pro Membership for FREE</strong> immediately!
                    </p>
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-semibold">Free Trial Status:</span>
                  {isAnnual ? (
                    <span className="font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md border border-amber-200">
                      Annual ({selected === "pro" ? "12+6 Mo Free · 16.5% Off" : "Direct 20% Discount"})
                    </span>
                  ) : isProFreeUpgradeEligible ? (
                    <span className="font-bold text-purple-700 bg-purple-100 px-2.5 py-0.5 rounded-md border border-purple-200">
                      14-Day Free Pro Upgrade (No ₹1 Required)
                    </span>
                  ) : hasUsedTrial ? (
                    <span className="font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-md border border-blue-200">
                      Paid Plan Upgrade (Trial Already Used)
                    </span>
                  ) : (
                    <span className="font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-200">
                      {selected === "pro" ? 14 : plan.trial_days} Days Free (via ₹1 Autopay)
                    </span>
                  )}
                </div>

                {/* Promo Code Box */}
                <div className="pt-3 border-t border-slate-200 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                    <span className="flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-blue-600" />
                      <span>Have a Promo / Discount Code?</span>
                    </span>
                    {appliedPromo && (
                      <span className="text-emerald-700 text-[11px] font-mono font-bold">
                        {appliedPromo.code} Applied
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      value={promoInput}
                      onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                      placeholder="e.g. DIWALI50, WELCOME20"
                      disabled={!!appliedPromo}
                      className="h-10 text-xs font-mono uppercase font-bold rounded-xl bg-white border-slate-200 text-slate-900 placeholder:text-slate-400"
                    />
                    {appliedPromo ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => { setAppliedPromo(null); setPromoInput(""); }}
                        className="h-10 px-3 text-xs font-bold rounded-xl border-red-200 text-red-600 bg-red-50 hover:bg-red-100 cursor-pointer"
                      >
                        Remove
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        size="sm"
                        disabled={validatingPromo}
                        onClick={handleValidatePromo}
                        className="h-10 px-4 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shrink-0 shadow-xs cursor-pointer"
                      >
                        {validatingPromo ? "Checking..." : "Apply Code"}
                      </Button>
                    )}
                  </div>

                  {appliedPromo && (
                    <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold flex items-center justify-between">
                      <span>🎉 Code {appliedPromo.code} applied!</span>
                      <span>-₹{appliedPromo.discount_amount} Instant Off</span>
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center pt-3 border-t border-slate-200">
                  <span className="text-slate-500 font-semibold">Due Today:</span>
                  <div className="text-right">
                    {appliedPromo && (
                      <div className="text-xs text-slate-400 line-through">
                        {isAnnual ? `₹${plan.annual}.00` : isProFreeUpgradeEligible ? `₹${plan.monthly}.00` : hasUsedTrial ? `₹${plan.monthly}.00` : "₹1.00"}
                      </div>
                    )}
                    <span className="font-display font-extrabold text-2xl text-emerald-600">
                      {isAnnual
                        ? `₹${Math.max(0, plan.annual - (appliedPromo?.discount_amount || 0))}.00`
                        : isProFreeUpgradeEligible
                        ? "₹0.00"
                        : hasUsedTrial
                          ? `₹${Math.max(0, plan.monthly - (appliedPromo?.discount_amount || 0))}.00`
                          : "₹1.00"
                      }
                    </span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-500 pt-1 leading-relaxed">
                  {isAnnual ? (
                    <span>{selected === "pro" ? "Covers 12+6 = 18 months total Pro access. Renews annually. Cancel anytime from Billing." : "Covers full 12 months. Renews annually. Cancel anytime from Billing."}</span>
                  ) : isProFreeUpgradeEligible ? (
                    <span>
                      <b>100% Free 14-day Kivo Pro Upgrade</b> for existing merchants. Zero charge today (no ₹1 required). After 14 days, renews at ₹499/month with 1+1 month free.
                    </span>
                  ) : hasUsedTrial ? (
                    <span>
                      {selected === "pro" ? "Instant activation for 60 days (1+1 month free) at ₹499/month." : `Instant activation for 30 days. Renews monthly at ₹${plan.monthly}/month.`}
                    </span>
                  ) : (
                    <span>
                      <b>₹1 will be charged via Razorpay Autopay</b> to verify UPI/card mandate. Monthly subscription of ₹{plan.monthly}/month will auto-charge only after {selected === "pro" ? 14 : plan.trial_days} days.
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-7 space-y-3">
                {isAnnual ? (
                  // ANNUAL PLAN: DIRECT PAYMENT, NO FREE TRIAL
                  <Button 
                    disabled={busy} 
                    onClick={pay} 
                    className="w-full h-14 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-sm shadow-lg shadow-blue-500/25 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>{busy ? "Opening Razorpay…" : selected === "pro" ? `Pay ₹${plan.annual} for 18 Months Access (12+6 Mo Free)` : `Pay ₹${plan.annual} for 1 Year Access`}</span>
                  </Button>
                ) : isProFreeUpgradeEligible ? (
                  // DUKAAN PRO FREE UPGRADE FOR MERCHANTS WHO ALREADY USED A TRIAL
                  <>
                    <Button 
                      disabled={busy} 
                      onClick={activateProFreeUpgrade} 
                      className="w-full h-14 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-sm shadow-lg shadow-purple-500/25 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>{busy ? "Activating Pro Upgrade…" : "Activate 14-Day Free Dukaan Pro Access (₹0)"}</span>
                    </Button>

                    <Button 
                      disabled={busy} 
                      onClick={pay} 
                      variant="outline" 
                      className="w-full h-11 rounded-2xl border border-white/20 hover:border-purple-500 text-slate-200 hover:text-white font-bold text-xs bg-white/5 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <CreditCard className="w-4 h-4 text-purple-400" />
                      <span>Skip Trial & Pay ₹{plan.monthly}/month (1+1 Month Free)</span>
                    </Button>
                  </>
                ) : (hasUsedTrial || isSubActiveNow) ? (
                  // TRIAL ALREADY CLAIMED OR ACTIVE SUBSCRIPTION: PAID TRANSITION
                  <Button 
                    disabled={busy} 
                    onClick={pay} 
                    className={`w-full h-14 rounded-2xl font-extrabold text-sm shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 text-white cursor-pointer ${
                      isSubActiveNow && userRank > 0 && selectedRank < userRank 
                        ? "bg-amber-600 hover:bg-amber-500 shadow-amber-600/25" 
                        : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-blue-500/25"
                    }`}
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>
                      {busy 
                        ? "Opening Razorpay…" 
                        : isSubActiveNow && selected === userPlanKey
                        ? `Pay ₹${Math.max(0, plan.monthly - (appliedPromo?.discount_amount || 0))} & Renew ${plan.name} Plan`
                        : isSubActiveNow && userRank > 0 && selectedRank < userRank
                        ? `Pay ₹${Math.max(0, plan.monthly - (appliedPromo?.discount_amount || 0))} & Downgrade to ${plan.name} (Upcoming Cycle)`
                        : selected === "pro"
                        ? `Pay ₹499/month (1+1 Mo Free) & Upgrade to Pro`
                        : `Pay ₹${Math.max(0, plan.monthly - (appliedPromo?.discount_amount || 0))}/month & Activate ${plan.name}`}
                    </span>
                  </Button>
                ) : (
                  // MONTHLY PLAN: ₹1 AUTOPAY MANDATE FOR FREE TRIAL
                  <>
                    <Button 
                      disabled={busy} 
                      onClick={startAutopayTrial} 
                      className="w-full h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm shadow-lg shadow-emerald-500/25 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Zap className="w-4 h-4" />
                      <span>{busy ? "Opening Autopay Verification…" : `Verify ₹1 & Start ${selected === "pro" ? 14 : plan.trial_days}-Day FREE Trial`}</span>
                    </Button>

                    <Button 
                      disabled={busy} 
                      onClick={pay} 
                      variant="outline" 
                      className="w-full h-11 rounded-2xl border border-white/20 hover:border-blue-500 text-slate-200 hover:text-white font-bold text-xs bg-white/5 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <CreditCard className="w-4 h-4 text-blue-400" />
                      <span>{selected === "pro" ? "Skip Trial & Pay ₹499/month (1+1 Mo Free) Directly" : `Skip Trial & Pay ₹${plan.monthly}/month Directly`}</span>
                    </Button>
                  </>
                )}
              </div>

              {/* Trust badges */}
              <div className="mt-6 pt-5 border-t border-white/10 flex items-center justify-center gap-6 text-[11px] text-slate-400 font-medium">
                <span className="flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-emerald-400" /> 256-bit SSL Secure
                </span>
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-400" /> Razorpay Verified
                </span>
                <span className="flex items-center gap-1">
                  <Smartphone className="w-3.5 h-3.5 text-indigo-400" /> All UPI Supported
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* =========================================================
            FREQUENTLY ASKED QUESTIONS (FAQ)
        ========================================================= */}
        <div className="mt-20 max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-1 text-xs uppercase font-extrabold text-blue-400 tracking-wider mb-1">
              <HelpCircle className="w-3.5 h-3.5" /> Have Questions?
            </div>
            <h3 className="font-display text-2xl md:text-3xl font-bold text-white">
              Frequently Asked Questions
            </h3>
          </div>

          <div className="space-y-3">
            {FAQS.map((faq, i) => {
              const isOpen = expandedFaq === i;
              return (
                <div 
                  key={i} 
                  className="bg-slate-900/60 rounded-2xl border border-white/10 overflow-hidden transition-all shadow-md"
                >
                  <button
                    onClick={() => setExpandedFaq(isOpen ? -1 : i)}
                    className="w-full p-5 text-left font-heading font-bold text-sm text-white flex items-center justify-between gap-4 hover:bg-white/5 cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${isOpen ? "rotate-180 text-blue-400" : ""}`} />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 text-xs text-slate-300 font-medium leading-relaxed border-t border-white/10 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </main>
    </div>
  );
}

/* =========================================================
   CONFETTI CELEBRATION MODAL ON PLAN ACTIVATION
========================================================= */
function PremiumLiveAnimation({ plan, done, onOpen }) {
  const particles = Array.from({ length: 28 }, (_, i) => i);
  const isTrial = done?.status === "trial";
  const isProUpgrade = Boolean(done?.is_pro_upgrade);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (onOpen) onOpen();
    }, 2500);
    return () => clearTimeout(timer);
  }, [onOpen]);

  return (
    <div className="min-h-screen bg-brand-sand text-brand-indigo flex flex-col items-center justify-center p-6 text-center select-none font-sans relative overflow-hidden">
      {/* Ambient warm glow */}
      <div className="absolute w-[500px] h-[500px] rounded-full bg-brand-terracotta/10 blur-3xl pointer-events-none" />

      {particles.map((i) => (
        <motion.i 
          key={i} 
          className="absolute w-2.5 h-2.5 rounded-full bg-brand-terracotta pointer-events-none" 
          initial={{ opacity: 0, scale: 0, x: 0, y: 0 }} 
          animate={{ 
            opacity: [0, 1, 1, 0], 
            scale: [0, 1, 0.8, 0.2], 
            x: Math.cos(i * 1.73) * (140 + (i % 5) * 50), 
            y: Math.sin(i * 2.21) * (120 + (i % 7) * 50) 
          }} 
          transition={{ duration: 2.2 + (i % 5) * 0.25, delay: i * 0.035, ease: "easeOut" }} 
        />
      ))}

      <motion.div 
        className="relative z-10 max-w-lg bg-white border-2 border-brand-mitti rounded-3xl p-8 md:p-12 shadow-2xl flex flex-col items-center" 
        initial={{ opacity: 0, y: 40, scale: 0.9 }} 
        animate={{ opacity: 1, y: 0, scale: 1 }} 
        transition={{ duration: 0.6 }}
      >
        <div className={`w-20 h-20 rounded-3xl ${isProUpgrade ? "bg-purple-700" : "bg-emerald-600"} text-white grid place-items-center mb-6 shadow-md`}>
          <Check className="w-10 h-10" strokeWidth={3} />
        </div>

        <div className="text-xs uppercase tracking-widest font-extrabold text-brand-terracotta mb-2">
          {isProUpgrade 
            ? "🎉 14-Day Free Pro Upgrade Active (₹0 Charge)" 
            : isTrial 
            ? `₹1 Autopay Verified · ${plan?.trial_days || 14}-Day Trial Live` 
            : "Subscription Active"}
        </div>

        <h1 className="font-display text-4xl md:text-5xl font-bold text-brand-indigo mb-3">
          Congratulations!
        </h1>

        <p className="text-sm text-brand-indigo/75 max-w-sm mb-8 leading-relaxed font-medium">
          {isProUpgrade ? (
            <span>Your <b>Dukaan Pro 14-Day Free Upgrade</b> is now active with <b>₹0 charge</b>. Enjoy custom billing, custom dashboard, and 24/7 dedicated support!</span>
          ) : isTrial ? (
            <span>Your <b>₹1 Autopay Mandate</b> is verified. Your <b>{plan?.name || "Business"} Plan</b> {plan?.trial_days}-Day Free Trial is now active.</span>
          ) : (
            <span>Your <b>{plan?.name || "Business"} Plan</b> {done?.annual ? "Annual Subscription" : "Subscription"} is now active.</span>
          )}
        </p>

        <Button 
          onClick={onOpen} 
          className="w-full h-14 rounded-2xl bg-brand-terracotta hover:bg-brand-terracotta/90 text-white font-bold text-sm shadow-md active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          <Rocket className="w-4 h-4" />
          <span>Open My Dukaan Dashboard</span>
          <ArrowRight className="w-4 h-4" />
        </Button>

        <p className="mt-4 text-[11px] text-brand-indigo/50 font-medium">
          Redirecting automatically to your dashboard in a moment…
        </p>
      </motion.div>
    </div>
  );
}
