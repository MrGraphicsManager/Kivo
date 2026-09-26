import { Outlet, NavLink, useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { useEffect, useState, useCallback, useMemo } from "react";
import { t } from "@/lib/i18n";
import { LayoutDashboard, Receipt, Package, Warehouse, Users, Wallet, ClipboardList, BarChart3, Settings as Cog, LogOut, Store, CreditCard, ShieldCheck, ShieldAlert, Lock, Monitor, Bell, CheckCheck, AlertTriangle, X, RotateCw, Eye, Menu, ChevronRight, Sparkles, Sun, Moon, ShoppingBag, Search, ChevronDown, Headphones } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { PLAN_TIER, ROUTE_PLAN } from "@/components/SubGate";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import RenewalBanner from "@/components/RenewalBanner";
import { isCashierModeActive, getActiveCashierName, setCashierModeActive } from "@/lib/proStaffPermissions";
import OwnerPinDialog from "@/components/OwnerPinDialog";
import { toast } from "sonner";

const NAV = [
  { to: "/app", key: "dashboard", label: "Dashboard", Icon: LayoutDashboard, end: true },
  { to: "/app/pos", key: "new_bill", label: "New Bill", Icon: Receipt },
  { to: "/app/products", key: "products", label: "Products", Icon: Package },
  { to: "/app/customers", key: "customers", label: "Customers", Icon: Users },
  { to: "/app/udhaar", key: "udhaar", label: "Udhaar / Credit", Icon: Wallet },
  { to: "/app/expenses", key: "expenses", label: "Expenses", Icon: CreditCard },
  { to: "/app/reports", key: "reports", label: "Reports", Icon: BarChart3 },
  { to: "/app/billing", key: "subscription", label: "Subscription", Icon: ShieldCheck },
  { to: "/app/settings", key: "settings", label: "Settings", Icon: Cog },
];

const MOBILE_NAV = [
  { to: "/app", key: "dashboard", label: "Dashboard", Icon: LayoutDashboard, end: true },
  { to: "/app/pos", key: "new_bill", label: "New Bill", Icon: Receipt },
  { to: "/app/products", key: "products", label: "Products", Icon: Package },
  { to: "/app/udhaar", key: "udhaar", label: "Udhaar", Icon: Wallet },
  { to: "/app/billing", key: "subscription", label: "Subscription", Icon: ShieldCheck },
  { to: "#menu", key: "menu", label: "Menu", Icon: Menu, isAction: true },
];


/* =========================================================
   NOTIFICATION BELL HOOK
========================================================= */

function useNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/dashboard");
      const notifs = [];
      const now = new Date();

      // Low stock notifications
      if (data?.low_stock && Array.isArray(data.low_stock)) {
        data.low_stock.slice(0, 3).forEach((p, i) => {
          notifs.push({
            id: `low_stock_${p._id || p.id || i}`,
            type: "warning",
            title: "Low Stock",
            message: `${p.name}: only ${p.stock} left (min: ${p.min_stock})`,
            time: now.toISOString(),
            read: false,
          });
        });
      }

      // Today's orders notification
      if (data?.today_orders > 0) {
        notifs.push({
          id: "today_orders",
          type: "info",
          title: "Today's Orders",
          message: `${data.today_orders} order${data.today_orders > 1 ? "s" : ""} received today`,
          time: now.toISOString(),
          read: false,
        });
      }

      // Pending udhaar notification
      if (data?.pending_udhaar > 0) {
        notifs.push({
          id: "pending_udhaar",
          type: "warning",
          title: "Pending Udhaar",
          message: `₹${Number(data.pending_udhaar || 0).toLocaleString("en-IN")} udhaar pending`,
          time: now.toISOString(),
          read: false,
        });
      }

      // Today's sales notification
      if (data?.today_sales > 0) {
        notifs.push({
          id: "today_sales",
          type: "success",
          title: "Today's Sales",
          message: `₹${Number(data.today_sales || 0).toLocaleString("en-IN")} in sales today`,
          time: now.toISOString(),
          read: true,
        });
      }

      // Cap at 10 (FIFO — keep latest 10)
      setNotifications(notifs.slice(0, 10));
    } catch {
      // Silent fail — notifications are non-critical
    } finally {
      setLoading(false);
    }
  }, []);

  const markRead = useCallback((id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  return { notifications, unreadCount, fetchNotifications, markRead, markAllRead, loading };
}


/* =========================================================
   APP LAYOUT
========================================================= */

export default function AppLayout() {
  const { user, shops, currentShopId, setActiveShop, logout, lang, setLang, refresh: refreshAuth } = useAuth();
  const nav = useNavigate();
  const activeShop = (shops || []).find(s => s?.id === currentShopId) || shops?.[0] || { name: "Apni Dukaan" };
  const currentShop = activeShop;
  const [subscription, setSubscription] = useState(() => {
    let localSub = user?.subscription || null;
    if (!localSub) {
      try {
        const u = JSON.parse(localStorage.getItem("dukaan_user") || "{}");
        localSub = u?.subscription || null;
      } catch {}
    }
    return localSub;
  });
  const [subscriptionLoaded, setSubscriptionLoaded] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const { notifications, unreadCount, fetchNotifications, markRead, markAllRead } = useNotifications();
  const { theme, toggleTheme, isDark } = useTheme();
  const [topSearch, setTopSearch] = useState("");
  const userInitials = useMemo(() => {
    const name = (user?.name || "Priyen Naik").trim();
    const parts = name.split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }, [user?.name]);
  const [activeTheme, setActiveTheme] = useState(() => {
    return localStorage.getItem("dukaan_active_theme") || "terracotta";
  });

  useEffect(() => {
    const handleThemeEvent = (e) => {
      const newTh = e?.detail || localStorage.getItem("dukaan_active_theme") || "terracotta";
      setActiveTheme(newTh);
    };
    window.addEventListener("dukaan_theme_changed", handleThemeEvent);
    window.addEventListener("storage", handleThemeEvent);
    return () => {
      window.removeEventListener("dukaan_theme_changed", handleThemeEvent);
      window.removeEventListener("storage", handleThemeEvent);
    };
  }, []);

  // Cashier Mode State & Listeners
  const [isCashierMode, setIsCashierMode] = useState(() => isCashierModeActive());
  const [cashierName, setCashierName] = useState(() => getActiveCashierName(currentShopId));
  const [pinModalOpen, setPinModalOpen] = useState(false);

  useEffect(() => {
    const handleCashierEvent = () => {
      setIsCashierMode(isCashierModeActive());
      setCashierName(getActiveCashierName(currentShopId));
    };
    window.addEventListener("dukaan_cashier_mode_changed", handleCashierEvent);
    window.addEventListener("dukaan_shift_ended", handleCashierEvent);
    window.addEventListener("storage", handleCashierEvent);
    return () => {
      window.removeEventListener("dukaan_cashier_mode_changed", handleCashierEvent);
      window.removeEventListener("dukaan_shift_ended", handleCashierEvent);
      window.removeEventListener("storage", handleCashierEvent);
    };
  }, [currentShopId]);

  // Read the current subscription from the backend if available; otherwise keep local state
  useEffect(() => {
    let alive = true;
    setSubscriptionLoaded(false);
    api.get("/subscriptions/me")
      .then(r => { 
        if (alive && r.data?.active) {
          setSubscription(r.data.active); 
        }
      })
      .catch(() => {})
      .finally(() => { if (alive) setSubscriptionLoaded(true); });
    return () => { alive = false; };
  }, [user?.id, user?.subscription, currentShopId]);

  // Fetch notifications on mount and every 60 seconds
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Store Inspector Session (Admin impersonating merchant)
  const inspectorSession = (() => {
    try {
      const raw = sessionStorage.getItem("dukaan_inspector_mode");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  })();

  const exitInspector = () => {
    if (inspectorSession) {
      if (inspectorSession.original_token) {
        localStorage.setItem("dukaan_token", inspectorSession.original_token);
      }
      if (inspectorSession.original_user) {
        localStorage.setItem("dukaan_user", JSON.stringify(inspectorSession.original_user));
      }
      sessionStorage.removeItem("dukaan_inspector_mode");
      window.location.href = "/admin";
    }
  };

  // Platform configuration: Maintenance mode, OTA Updates & Announcement
  const [platformConfig, setPlatformConfig] = useState(() => {
    return {
      maintenance_mode: localStorage.getItem("dukaan_platform_maintenance") === "true",
      announcement: localStorage.getItem("dukaan_platform_announcement") || "",
      frozen_merchants: {}
    };
  });
  const [dismissedAnnouncement, setDismissedAnnouncement] = useState("");

  const isMasterAdmin = (user?.email || "").toLowerCase().trim() === "contact@officialdukaan.in" || 
    Boolean(user?.is_admin) || 
    (user?.email || "").toLowerCase().trim() === "priyennaik@gmail.com";

  const checkPlatformConfig = useCallback(async () => {
    try {

      const res = await api.get("/platform/config");
      if (res?.data) {
        setPlatformConfig({
          maintenance_mode: !!res.data.maintenance_mode,
          announcement: res.data.announcement || "",
          frozen_merchants: res.data.frozen_merchants || {}
        });
        if (res.data.maintenance_mode) {
          localStorage.setItem("dukaan_platform_maintenance", "true");
        } else {
          localStorage.removeItem("dukaan_platform_maintenance");
        }
        if (res.data.announcement) {
          localStorage.setItem("dukaan_platform_announcement", res.data.announcement);
        } else {
          localStorage.removeItem("dukaan_platform_announcement");
        }
        if (typeof res.data.receipt_branding_enabled === "boolean") {
          localStorage.setItem("dukaan_receipt_branding_enabled", String(res.data.receipt_branding_enabled));
        }
        if (typeof res.data.payment_alert_chime === "boolean") {
          localStorage.setItem("dukaan_payment_alert_chime", String(res.data.payment_alert_chime));
        }

        // Feature 9 & 10: Real-time Freeze & Verification Sync for current merchant
        const targetShopId = currentShopId || localStorage.getItem("dukaan_shop_id");
        if (user?.email) {
          const em = user.email.toLowerCase();
          const isFrozenCloud = Boolean(
            res.data.frozen_merchants?.[em] ||
            (targetShopId && res.data.frozen_merchants?.[targetShopId]) ||
            (user?.shop_id && res.data.frozen_merchants?.[user.shop_id])
          );
          if (isFrozenCloud) {
            localStorage.setItem(`dukaan_store_frozen_${user.email}`, "true");
          } else {
            localStorage.removeItem(`dukaan_store_frozen_${user.email}`);
          }
          if (res.data.verified_merchants && res.data.verified_merchants[em] !== undefined) {
            const isVerifiedCloud = Boolean(res.data.verified_merchants[em]);
            const stored = localStorage.getItem("dukaan_user");
            if (stored) {
              try {
                const u = JSON.parse(stored);
                if (u.is_verified !== isVerifiedCloud) {
                  u.is_verified = isVerifiedCloud;
                  localStorage.setItem("dukaan_user", JSON.stringify(u));
                  if (typeof refreshAuth === "function") refreshAuth();
                }
              } catch {}
            }
          }
        }

        // Feature 14: Global Force Update / OTA Cache Refresh
        if (res.data.ota_version) {
          const currentOta = parseInt(localStorage.getItem("dukaan_ota_version") || "0", 10);
          if (res.data.ota_version > currentOta && !isMasterAdmin) {
            localStorage.setItem("dukaan_ota_version", String(res.data.ota_version));
            console.log("OTA Update received. Reloading application cache...");
            setTimeout(() => {
              window.location.reload();
            }, 600);
          }
        }

        // Feature 30: Emergency Kill Switch
        if (res.data.kill_switch_active && !isMasterAdmin && !inspectorSession) {
          localStorage.removeItem("dukaan_access_token");
          localStorage.removeItem("dukaan_user");
          window.location.href = "/login?emergency_lockdown=1";
        } else if (!res.data.kill_switch_active && !res.data.maintenance_mode) {
          localStorage.removeItem("dukaan_platform_maintenance");
        }
      }
    } catch (_) {}

    // Live subscription sync: instantly check if admin granted plan
    try {
      const subRes = await api.get("/subscriptions/me");
      if (subRes.data?.active) {
        const activeSub = subRes.data.active;
        setSubscription(activeSub);
        const stored = localStorage.getItem("dukaan_user");
        if (stored) {
          try {
            const u = JSON.parse(stored);
            if (u.subscription?.plan !== activeSub.plan || u.subscription?.expires_at !== activeSub.expires_at) {
              u.subscription = activeSub;
              if (activeSub.plan === "premium") u.is_premium = true;
              localStorage.setItem("dukaan_user", JSON.stringify(u));
              if (typeof refreshAuth === "function") refreshAuth();
            }
          } catch {}
        }
      }
    } catch (_) {}
  }, [isMasterAdmin, inspectorSession, user?.email, currentShopId, user?.shop_id, refreshAuth]);

  useEffect(() => {
    checkPlatformConfig();
    const interval = setInterval(checkPlatformConfig, 60000);
    const onFocus = () => checkPlatformConfig();
    window.addEventListener("focus", onFocus);
    const onVis = () => {
      if (document.visibilityState === "visible") checkPlatformConfig();
    };
    document.addEventListener("visibilitychange", onVis);

    // Instant Zero-Latency Real-Time Push Sync via SSE
    let eventSource;
    try {
      if (typeof window !== "undefined" && window.EventSource) {
        eventSource = new EventSource("https://ntfy.sh/dukaan_sync_bus_v2_99482/sse");
        eventSource.onmessage = (e) => {
          try {
            const payload = JSON.parse(e.data);
            if (payload && payload.message) {
              const busData = JSON.parse(payload.message);
              if (busData) {
                setPlatformConfig(prev => ({
                  ...prev,
                  ...(typeof busData.maintenance_mode === "boolean" ? { maintenance_mode: busData.maintenance_mode } : {}),
                  ...(typeof busData.announcement === "string" ? { announcement: busData.announcement } : {}),
                  ...(busData.frozen_merchants ? { frozen_merchants: { ...prev.frozen_merchants, ...busData.frozen_merchants } } : {})
                }));
                if (typeof busData.maintenance_mode === "boolean") {
                  if (busData.maintenance_mode) localStorage.setItem("dukaan_platform_maintenance", "true");
                  else localStorage.removeItem("dukaan_platform_maintenance");
                }
                if (typeof busData.announcement === "string") {
                  if (busData.announcement) localStorage.setItem("dukaan_platform_announcement", busData.announcement);
                  else localStorage.removeItem("dukaan_platform_announcement");
                }
                checkPlatformConfig();
              }
            }
          } catch {}
        };
      }
    } catch (_) {}

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVis);
      if (eventSource) {
        try { eventSource.close(); } catch (_) {}
      }
    };
  }, [checkPlatformConfig]);



  // Feature 9: Store Freeze & Fraud Security Shield
  const activeShopId = currentShopId || localStorage.getItem("dukaan_shop_id");
  const isMerchantFrozen = Boolean(
    user?.is_frozen || 
    localStorage.getItem(`dukaan_store_frozen_${user?.email}`) === "true" ||
    (user?.email && platformConfig.frozen_merchants?.[user.email.toLowerCase()]) ||
    (activeShopId && platformConfig.frozen_merchants?.[activeShopId]) ||
    (user?.shop_id && platformConfig.frozen_merchants?.[user.shop_id])
  );
  const isStoreFrozen = isMerchantFrozen;
  if (isStoreFrozen) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 rounded-3xl bg-rose-500/10 border border-rose-500/30 text-rose-500 flex items-center justify-center mb-6 shadow-2xl">
          <ShieldAlert className="w-10 h-10 animate-bounce" />
        </div>
        <span className="text-xs font-mono uppercase tracking-widest text-rose-400 font-bold bg-rose-950/60 px-3.5 py-1 rounded-full border border-rose-800/50 mb-3">
          Account Suspended · Security Shield
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight max-w-lg mb-3">
          Merchant Access Temporarily Restricted
        </h1>
        <p className="text-sm text-slate-400 max-w-md mb-6 leading-relaxed">
          This store has been temporarily locked by platform security for compliance verification or fraud prevention. 
          Please contact our security operations desk to re-activate your store.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <a
            href="mailto:contact@officialdukaan.in?subject=Reactivate%20Frozen%20Store%20Request"
            className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-rose-600/20"
          >
            Contact Security (contact@officialdukaan.in)
          </a>
          {inspectorSession && (
            <Button
              onClick={exitInspector}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-rose-300 font-bold rounded-xl text-xs border border-slate-700"
            >
              Exit Inspector & Return to Admin
            </Button>
          )}
          {(isMasterAdmin || user?.is_admin) && !inspectorSession && (
            <a
              href="/admin"
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-rose-300 font-bold rounded-xl text-xs border border-slate-700"
            >
              Open Admin Console (/admin)
            </a>
          )}
        </div>
      </div>
    );
  }

  const activePlan = subscription?.plan || user?.subscription?.plan || "starter";
  const isPremium = activePlan === "premium" || activePlan === "pro" || user?.is_premium || user?.is_pro || user?.plan === "premium" || user?.plan === "pro";
  const isPro = activePlan === "pro" || user?.is_pro || user?.plan === "pro";
  const tierMap = PLAN_TIER || { starter: 1, business: 2, premium: 3, pro: 4 };
  const routeMap = ROUTE_PLAN || {};
  const currentTier = user?.is_admin ? 999 : (tierMap[activePlan] || 1);
  const isLocked = (to) => {
    const need = routeMap[to];
    if (!need) return false;
    return currentTier < (tierMap[need] || 1);
  };
  const premiumClass = isPremium ? "premium" : "standard";

  const NOTIF_COLORS = {
    warning: "bg-amber-100 text-amber-800",
    info: "bg-blue-100 text-blue-800",
    success: "bg-emerald-100 text-emerald-800",
    error: "bg-red-100 text-red-800",
  };

  // Full-screen Maintenance Mode for merchants
  if (platformConfig.maintenance_mode) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 rounded-3xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mb-6 shadow-2xl">
          <AlertTriangle className="w-10 h-10 animate-pulse" />
        </div>
        <span className="text-xs font-mono uppercase tracking-widest text-amber-400 font-bold bg-amber-950/60 px-3 py-1 rounded-full border border-amber-800/50 mb-3">
          Scheduled Platform Maintenance
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight max-w-lg mb-3">
          Kivo is Updating
        </h1>
        <p className="text-sm text-slate-400 max-w-md mb-6 leading-relaxed">
          Our engineering team is currently deploying an upgrade to enhance system security and speed. All merchant data is safe and transactions will resume momentarily.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button
            onClick={() => window.location.reload()}
            className="rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs h-10 px-5"
          >
            Check Status Again
          </Button>
          {inspectorSession && (
            <Button
              onClick={exitInspector}
              className="rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs h-10 px-5 border border-slate-700"
            >
              Exit Inspector & Return to Admin
            </Button>
          )}
          {(isMasterAdmin || user?.is_admin) && !inspectorSession && (
            <a
              href="/admin"
              className="rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs h-10 px-5 flex items-center justify-center border border-slate-700"
            >
              Open Admin Console (/admin)
            </a>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-[#F8FAFC] dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col md:flex-row theme-${activeTheme} ${premiumClass}`}>

      {/* =====================================================
          DESKTOP SIDEBAR (Full-height sticky on the left)
      ===================================================== */}
      <aside className="hidden md:flex flex-col w-60 xl:w-64 shrink-0 bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800 h-screen sticky top-0 z-40">
        {/* Logo & Tagline */}
        <div className="p-4 sm:p-5 flex items-center gap-3">
          <Link to="/app" className="flex items-center gap-2">
            <img src="/kivo-logo.png" alt="Kivo" className="h-8 w-auto object-contain" />
          </Link>
        </div>

        {/* Navigation Links (Matching Screenshot: 8 items) */}
        <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
          {NAV.map(({ to, key, label, Icon, end }) => {
            const locked = isLocked(to);
            return (
              <NavLink
                key={to}
                to={to}
                end={end}
                data-testid={`nav-${key}`}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    isActive
                      ? "bg-blue-50 text-blue-600 font-bold dark:bg-blue-950/60 dark:text-blue-400 shadow-2xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60"
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="flex-1">{label}</span>
                {locked && <Lock className="w-3 h-3 text-amber-500 shrink-0" />}
              </NavLink>
            );
          })}
          {user?.is_admin && (
            <NavLink
              to="/admin"
              data-testid="nav-admin"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  isActive
                    ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold"
                    : "text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`
              }
            >
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>Admin</span>
            </NavLink>
          )}
        </nav>

        {/* Bottom Store Card & Need Help Card (Matching Screenshot) */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
          <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-50/70 dark:bg-slate-800/40">
            <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center text-white shrink-0">
              <Store className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                {activeShop?.name || user?.store_name || user?.name || "Priyen's Store"}
              </div>
              <button
                onClick={() => nav("/app/settings?tab=shop")}
                className="text-[11px] text-blue-600 font-semibold hover:underline flex items-center gap-0.5 mt-0.5 cursor-pointer"
              >
                <span>View Profile</span>
                <span>→</span>
              </button>
            </div>
          </div>

          <div
            onClick={() => nav("/app/settings?tab=support")}
            className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Headphones className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                Need Help?
              </div>
              <div className="text-[11px] text-slate-400 font-medium">
                Chat with support
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* =====================================================
          RIGHT CONTENT COLUMN (Topbar + Main Outlet)
      ===================================================== */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Store Inspector Mode Banner (Feature #1) */}
        {inspectorSession && (
          <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white px-4 py-2 text-xs font-bold flex items-center justify-between shadow-md sticky top-0 z-50">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 shrink-0 text-amber-200" />
              <span>
                <strong>👀 Store Inspector Active:</strong> Viewing store of <span className="underline decoration-amber-300 font-extrabold">{inspectorSession.target_name || "Merchant"}</span> ({inspectorSession.target_email}) as Super Administrator.
              </span>
            </div>
            <Button
              onClick={exitInspector}
              size="sm"
              className="bg-white text-slate-900 hover:bg-amber-100 font-extrabold text-[11px] h-7 px-3 rounded-lg shadow-sm border border-amber-200"
            >
              Exit Inspector & Return to Admin
            </Button>
          </div>
        )}

        {/* Cashier Mode Active Alert Banner */}
        {isCashierMode && (
          <div className="bg-gradient-to-r from-amber-600 via-purple-950 to-amber-700 text-white px-4 py-1.5 text-xs font-bold flex items-center justify-between shadow-md sticky top-0 z-50">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 shrink-0 text-amber-300 animate-pulse" />
              <span>
                <strong>🔒 Cashier Counter Active ({cashierName}):</strong> Wholesale cost prices & margins hidden. Deleting bills & products requires Owner PIN.
              </span>
            </div>
            <Button
              onClick={() => setPinModalOpen(true)}
              size="sm"
              className="bg-amber-400 text-slate-950 hover:bg-amber-300 font-extrabold text-[11px] h-6 px-3 rounded-lg shadow-sm"
            >
              Owner PIN Unlock
            </Button>
          </div>
        )}

        {/* Admin Simulation Alert Bar */}
        {(isMasterAdmin || inspectorSession) && (platformConfig.maintenance_mode || isMerchantFrozen) && (
          <div className="bg-amber-500 text-slate-950 px-4 py-2 text-xs font-black flex items-center justify-between shadow-md border-b border-amber-600 sticky top-0 z-50">
            <div className="flex-1 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-slate-950 animate-pulse flex-shrink-0" />
              <span>
                [ADMIN SIMULATION ACTIVE] — 
                {platformConfig.maintenance_mode ? " ⚠️ PLATFORM MAINTENANCE IS ACTIVE." : ""}
                {isMerchantFrozen ? " 🛡️ STORE SECURITY FREEZE IS ACTIVE." : ""}
              </span>
            </div>
            <span className="text-[10px] uppercase font-mono tracking-wider bg-slate-950 text-amber-300 px-2 py-0.5 rounded font-bold ml-3">
              Admin View
            </span>
          </div>
        )}

        {/* Global Merchant Broadcast Banner */}
        {platformConfig.announcement && dismissedAnnouncement !== platformConfig.announcement && (
          <div className="bg-slate-900 text-white px-4 py-2 text-xs font-semibold flex items-center justify-between border-b border-slate-800 shadow-md">
            <div className="flex-1 flex items-center gap-2.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
              <span className="text-amber-300 font-bold uppercase tracking-wider text-[10px] bg-amber-400/20 px-2 py-0.5 rounded border border-amber-300/30">
                Announcement
              </span>
              <span>{platformConfig.announcement}</span>
            </div>
            <button 
              onClick={() => setDismissedAnnouncement(platformConfig.announcement)}
              className="text-white/60 hover:text-white p-1 rounded-lg hover:bg-white/10 ml-3"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Topbar Header (Matching Screenshot) */}
        <header className="h-16 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 sticky top-0 z-30 px-4 sm:px-6 flex items-center justify-between gap-4">
          
          {/* Mobile Header: Hamburger + Brand */}
          <div className="flex md:hidden items-center gap-2.5">
            <button
              type="button"
              onClick={() => setMobileDrawerOpen(true)}
              className="w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-200 active:scale-95 shrink-0"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <img src="/kivo-logo.png" alt="Kivo" className="h-7 w-auto object-contain" />
          </div>

          {/* Center/Left: Search Bar (Matching Screenshot) */}
          <div className="relative flex-1 max-w-xl hidden sm:block">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search anything... (products, customers, bills)"
              value={topSearch}
              onChange={(e) => setTopSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && topSearch.trim()) {
                  nav(`/app/products?search=${encodeURIComponent(topSearch.trim())}`);
                }
              }}
              className="w-full pl-10 pr-4 py-2 bg-slate-100/90 dark:bg-slate-800 border-0 rounded-2xl text-xs sm:text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
            />
          </div>

          {/* Right Controls: Notification Bell, Theme toggle, User Profile Chip */}
          <div className="flex items-center gap-3">

            {/* Notification Bell */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  data-testid="notification-bell"
                  className="relative w-9 h-9 rounded-full grid place-items-center hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                  aria-label="Notifications"
                >
                  <Bell className="w-4 h-4" />
                  <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-slate-900" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto">
                <div className="flex items-center justify-between px-3 py-2">
                  <DropdownMenuLabel className="p-0 text-sm font-bold">Notifications</DropdownMenuLabel>
                  {unreadCount > 0 && (
                    <button
                      onClick={(e) => { e.stopPropagation(); markAllRead(); }}
                      className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                    >
                      <CheckCheck className="w-3 h-3" /> Mark all read
                    </button>
                  )}
                </div>
                <DropdownMenuSeparator />
                {notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center text-sm text-slate-400">
                    <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    No notifications yet
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <DropdownMenuItem
                      key={notif.id}
                      className={`flex items-start gap-3 px-3 py-2.5 cursor-pointer ${!notif.read ? "bg-slate-50 dark:bg-slate-800" : ""}`}
                      onClick={() => markRead(notif.id)}
                    >
                      <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${!notif.read ? "bg-blue-600" : "bg-transparent"}`} />
                      <div className="flex-1 min-w-0">
                        <span className={`inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${NOTIF_COLORS[notif.type] || NOTIF_COLORS.info}`}>
                          {notif.title}
                        </span>
                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 leading-snug">{notif.message}</p>
                      </div>
                    </DropdownMenuItem>
                  ))
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Dukaan Theme Switcher */}
            <button
              type="button"
              onClick={toggleTheme}
              data-testid="theme-toggle"
              className="w-9 h-9 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 grid place-items-center transition-all cursor-pointer"
              title={isDark ? "Switch to Light Mode" : "Switch to OLED Dark Mode"}
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>

            {/* User Profile Chip (Matching Screenshot) */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  data-testid="user-menu"
                  className="flex items-center gap-2.5 p-1 sm:px-2 sm:py-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-left cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                    {userInitials}
                  </div>
                  <div className="hidden sm:block text-left">
                    <div className="text-xs font-bold text-slate-800 dark:text-white leading-tight">
                      {user?.name || "Priyen Naik"}
                    </div>
                    <div className="text-[10px] text-slate-400 font-medium leading-tight truncate max-w-[130px]">
                      {activeShop?.name || user?.store_name || "Shree Kirana Store"}
                    </div>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 p-2">
                <div className="px-3 py-2 bg-slate-50 dark:bg-slate-800/60 rounded-xl mb-1">
                  <div className="font-bold text-sm text-slate-900 dark:text-white truncate">
                    {user?.name || "Priyen Naik"}
                  </div>
                  <div className="text-xs text-slate-500 truncate">
                    {user?.email || "owner@dukaan.in"}
                  </div>
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-600 text-white">
                      {user?.subscription?.plan || "Starter"} Plan
                    </span>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => nav("/app/settings?tab=account")} className="cursor-pointer py-2 text-xs font-semibold">
                  <Cog className="w-4 h-4 mr-2 text-slate-500" /> My Account & Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => nav("/app/settings?tab=shop")} className="cursor-pointer py-2 text-xs font-semibold">
                  <Store className="w-4 h-4 mr-2 text-slate-500" /> Shop & Branches
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => nav("/app/stock")} className="cursor-pointer py-2 text-xs font-semibold">
                  <Package className="w-4 h-4 mr-2 text-emerald-600" /> Stock & Inventory
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => nav("/app/orders")} className="cursor-pointer py-2 text-xs font-semibold">
                  <Receipt className="w-4 h-4 mr-2 text-blue-600" /> All Bills & Orders
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => nav("/app/counter")} className="cursor-pointer py-2 text-xs font-semibold">
                  <Monitor className="w-4 h-4 mr-2 text-purple-600" /> Fullscreen Counter Mode
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => nav("/app/billing")} className="cursor-pointer py-2 text-xs font-semibold">
                  <CreditCard className="w-4 h-4 mr-2 text-indigo-600" /> Billing & Subscription
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={async () => { await logout(); nav("/"); }} data-testid="logout-btn" className="cursor-pointer py-2 text-xs font-semibold text-red-600 hover:text-red-700">
                  <LogOut className="w-4 h-4 mr-2" /> {t(lang, "logout")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

          </div>
        </header>

        {/* Main Outlet */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 md:p-8 pb-24 md:pb-8">
          <RenewalBanner />
          <Outlet />
        </main>
      </div>


      {/* =====================================================
          MOBILE SLIDE-OUT NAVIGATION DRAWER (Mobile Only)
      ===================================================== */}
      {mobileDrawerOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity" 
            onClick={() => setMobileDrawerOpen(false)} 
          />

          {/* Drawer Panel */}
          <div className="relative w-[82%] max-w-xs bg-white dark:bg-slate-950 h-full shadow-2xl flex flex-col justify-between z-10 animate-in slide-in-from-left duration-200 border-r border-brand-mitti dark:border-slate-800">
            
            {/* Drawer Header */}
            <div className="p-4 border-b border-brand-mitti/60 dark:border-slate-800 flex items-center justify-between bg-brand-sand/40 dark:bg-slate-900/80">
              <div className="flex items-center gap-2.5">
                <img 
                  src="/kivo-logo.png" 
                  alt="Kivo" 
                  className="h-8 w-auto object-contain" 
                />
                <div>
                  <div className="text-xs font-bold text-brand-indigo truncate max-w-[130px]">
                    {activeShop?.name || "Apni Dukaan"}
                  </div>
                  <div className="text-[10px] text-brand-indigo/60 flex items-center gap-1 font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                    Online Store
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setMobileDrawerOpen(false)}
                className="w-8 h-8 rounded-full bg-white dark:bg-slate-900 border border-brand-mitti dark:border-slate-700 flex items-center justify-center text-brand-indigo/70 dark:text-slate-300 hover:text-brand-indigo"
                aria-label="Close menu"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Navigation Links Scrollable Area */}
            <nav className="flex-1 overflow-y-auto p-3 space-y-1">
              <div className="text-[10px] font-mono uppercase tracking-wider text-brand-indigo/40 px-3 py-1 font-bold">
                Menu & Management
              </div>
              {NAV.map(({ to, key, label, Icon, end, isProStudio }) => {
                const locked = isLocked(to);
                return (
                  <NavLink
                    key={to}
                    to={to}
                    end={end}
                    onClick={() => setMobileDrawerOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                        isActive 
                          ? isProStudio
                            ? "bg-gradient-to-r from-purple-700 via-indigo-600 to-purple-800 text-white shadow-xs"
                            : "bg-brand-indigo text-white shadow-xs" 
                          : isProStudio
                            ? "text-purple-800 hover:bg-purple-50 font-bold"
                            : "text-brand-indigo/80 hover:bg-brand-mitti/50 active:bg-brand-mitti"
                      }`
                    }
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isProStudio ? "text-amber-500" : ""}`} />
                    <span className="flex-1 text-xs">{label || t(lang, key)}</span>
                    {isProStudio && (
                      <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-mono tracking-wider">
                        PRO
                      </span>
                    )}
                    {locked && <Lock className="w-3.5 h-3.5 text-brand-terracotta shrink-0" />}
                  </NavLink>
                );
              })}

              {user?.is_admin && (
                <NavLink
                  to="/admin"
                  onClick={() => setMobileDrawerOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold bg-amber-500/10 text-amber-900 border border-amber-300 mt-2"
                >
                  <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Admin Console</span>
                </NavLink>
              )}
            </nav>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-brand-mitti/60 dark:border-slate-800 bg-brand-sand/30 dark:bg-slate-900/80 space-y-2">
              <div className="flex items-center justify-between text-xs text-brand-indigo/70 font-medium">
                <span className="truncate max-w-[150px] font-bold text-brand-indigo">{user?.name || user?.email?.split('@')[0]}</span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-brand-terracotta/10 text-brand-terracotta font-bold">
                  {user?.subscription?.plan || "Starter"}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  setMobileDrawerOpen(false);
                  await logout();
                  nav("/");
                }}
                className="w-full text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200 font-bold h-9 rounded-xl"
              >
                <LogOut className="w-3.5 h-3.5 mr-1.5" />
                {t(lang, "logout")}
              </Button>
              <div className="pt-2 text-center">
                <span className="text-[10px] text-brand-indigo/40 font-medium font-mono">
                  Kivo POS · A Product of PEAN
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          BOTTOM NAVIGATION (Mobile Only - Native App Feel)
      ===================================================== */}

      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-t border-brand-mitti dark:border-slate-800 shadow-nav pb-[env(safe-area-inset-bottom,0px)]">
        <div className="grid grid-cols-5 h-16 items-center px-1">
          {MOBILE_NAV.map(({ to, key, Icon, end, isAction }) => {
            if (isAction) {
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setMobileDrawerOpen(true)}
                  className="flex flex-col items-center justify-center gap-1 py-1.5 rounded-2xl text-[11px] font-bold text-brand-indigo/65 hover:text-brand-indigo active:scale-95 transition-all"
                >
                  <Icon className="w-5 h-5 text-brand-indigo/70" />
                  <span className="leading-tight truncate max-w-[64px]">{t(lang, key) || "Menu"}</span>
                </button>
              );
            }
            return (
              <NavLink
                key={to}
                to={to}
                end={end}
                data-testid={`bottomnav-${key}`}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center gap-1 py-1.5 rounded-2xl text-[11px] font-bold transition-all relative ${
                    isActive 
                      ? "text-brand-terracotta bg-brand-terracotta/10 scale-105" 
                      : "text-brand-indigo/65 hover:text-brand-indigo active:scale-95"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className={`w-5 h-5 transition-transform ${isActive ? "scale-110" : ""}`} />
                    <span className="leading-tight truncate max-w-[64px]">{t(lang, key)}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </div>
      </nav>

      {/* Universal Owner PIN Dialog */}
      <OwnerPinDialog
        isOpen={pinModalOpen}
        onClose={() => setPinModalOpen(false)}
        onSuccess={() => {
          setCashierModeActive(false);
          setIsCashierMode(false);
          toast.success("Owner mode unlocked! Full access restored.");
        }}
        shopId={currentShopId || "default"}
        title="Unlock Owner Mode"
        description="Enter your 4-digit Owner PIN to return to full Owner Mode with all admin controls."
      />
    </div>
  );
}
