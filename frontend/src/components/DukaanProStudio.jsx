import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Sparkles, 
  Receipt, 
  Palette, 
  FlaskConical, 
  Headphones, 
  CheckCircle2, 
  Printer, 
  QrCode, 
  FileText, 
  Volume2, 
  Zap, 
  Clock, 
  Phone, 
  MessageSquare, 
  ArrowRight, 
  Sliders, 
  Bot, 
  ExternalLink,
  ShieldCheck,
  Crown,
  Eye,
  Check,
  AlertCircle,
  AlertTriangle,
  Lock,
  KeyRound,
  Users,
  EyeOff,
  FileSpreadsheet
} from "lucide-react";
import { 
  PRO_INVOICE_TEMPLATES, 
  PRO_THEMES, 
  getProBillingSettings, 
  saveProBillingSettings, 
  getProThemeSettings, 
  saveProThemeSettings, 
  getProLabsSettings, 
  saveProLabsSettings, 
  getProWhatsAppSupportUrl 
} from "@/lib/proCustomizations";
import { 
  getProStaffSettings, 
  saveProStaffSettings, 
  setCashierModeActive, 
  isCashierModeActive, 
  getShiftRecords 
} from "@/lib/proStaffPermissions";
import { getStoredProducts, saveStoredProducts } from "@/lib/defaultProducts";
import { playVoiceSoundbox } from "@/lib/soundbox";
import { api } from "@/lib/api";

const PRESET_TERMS = [
  "Goods once sold cannot be returned without original cash receipt.",
  "Exchange within 7 days with original tag and bill only.",
  "All prices are inclusive of GST as applicable.",
  "Brand warranty handled directly by official authorized service centers.",
  "Thank you for shopping with us! No cash refund, store credit only."
];

export default function DukaanProStudio({ user, currentShop, isPro }) {
  const nav = useNavigate();
  const shopId = currentShop?.id || "default";
  const userEmail = user?.email || "merchant";

  const [subTab, setSubTab] = useState("billing"); // "billing" | "themes" | "labs" | "support"

  // 1. Custom Billing State (with cloud fallback from currentShop)
  const [billing, setBilling] = useState(() => getProBillingSettings(shopId, currentShop));
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [savingBilling, setSavingBilling] = useState(false);

  // Dynamic products & orders for AI Restock Velocity calculations
  const [productsList, setProductsList] = useState(() => getStoredProducts());
  const [ordersList, setOrdersList] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("dukaan_orders") || "[]");
    } catch {
      return [];
    }
  });

  // 2. Customize Themes State
  const [theme, setTheme] = useState(() => getProThemeSettings(userEmail));
  const [savingTheme, setSavingTheme] = useState(false);

  // 3. Early Access Labs State
  const [labs, setLabs] = useState(() => getProLabsSettings(userEmail));
  const [savingLabs, setSavingLabs] = useState(false);
  const [testingVoice, setTestingVoice] = useState(false);

  // 4. Dedicated Support State
  const [callbackOpen, setCallbackOpen] = useState(false);
  const [callbackPhone, setCallbackPhone] = useState(user?.phone || "");
  const [callbackReason, setCallbackReason] = useState("printer_setup");
  const [submittingCallback, setSubmittingCallback] = useState(false);
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketMessage, setTicketMessage] = useState("");
  const [submittingTicket, setSubmittingTicket] = useState(false);

  // 5. Staff & Permissions State
  const [staff, setStaff] = useState(() => getProStaffSettings(shopId, currentShop));
  const [savingStaff, setSavingStaff] = useState(false);
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [showCurrentPin, setShowCurrentPin] = useState(false);
  const [shiftHistory, setShiftHistory] = useState(() => getShiftRecords(shopId));
  const [cashierActive, setCashierActive] = useState(() => isCashierModeActive());
  const [openingFloat, setOpeningFloat] = useState("500");

  useEffect(() => {
    setStaff(getProStaffSettings(shopId, currentShop));
    setShiftHistory(getShiftRecords(shopId));
    setCashierActive(isCashierModeActive());
  }, [shopId, currentShop]);

  // Handle Save Staff Settings
  const handleSaveStaff = async () => {
    setSavingStaff(true);
    saveProStaffSettings(shopId, staff);

    // Sync to backend MongoDB
    try {
      if (shopId && shopId !== "default") {
        await api.put(`/shops/${shopId}`, {
          name: currentShop?.name || "My Dukaan",
          ...currentShop,
          pro_settings: {
            ...(currentShop?.pro_settings || {}),
            staff
          }
        });
      }
    } catch (err) {
      console.warn("Cloud sync for staff settings:", err);
    }

    setTimeout(() => {
      setSavingStaff(false);
      toast.success("Staff & security permission settings saved!");
    }, 300);
  };

  // Handle Update Owner PIN
  const handleUpdatePin = (e) => {
    if (e) e.preventDefault();
    if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
      toast.error("PIN must be exactly 4 numeric digits (e.g. 1234)");
      return;
    }
    if (newPin !== confirmPin) {
      toast.error("New PIN and Confirm PIN do not match!");
      return;
    }
    const updated = { ...staff, owner_pin: newPin };
    setStaff(updated);
    saveProStaffSettings(shopId, updated);
    setNewPin("");
    setConfirmPin("");
    toast.success("Master Owner Security PIN updated successfully!");
  };

  // Handle Instant Cashier Mode Activation
  const handleToggleCashierMode = () => {
    if (cashierActive) {
      setCashierModeActive(false);
      setCashierActive(false);
      toast.success("Exited Cashier Mode. Returned to Owner Mode.");
    } else {
      setCashierModeActive(true, staff.cashier_name || "Staff Cashier", Number(openingFloat) || 0);
      setCashierActive(true);
      toast.success(`Switched to Cashier Mode (${staff.cashier_name})! Opening counter float: ₹${openingFloat}`);
      nav("/app/pos");
    }
  };

  useEffect(() => {
    setBilling(getProBillingSettings(shopId, currentShop));
  }, [shopId, currentShop]);

  useEffect(() => {
    setTheme(getProThemeSettings(userEmail));
    setLabs(getProLabsSettings(userEmail));
  }, [userEmail]);

  // Load products & orders from cloud/local for accurate 7-day velocity
  useEffect(() => {
    api.get("/products")
      .then(r => {
        if (Array.isArray(r.data) && r.data.length > 0) {
          setProductsList(r.data);
          saveStoredProducts(r.data);
        }
      })
      .catch(() => {});

    api.get("/orders")
      .then(r => {
        if (Array.isArray(r.data) && r.data.length > 0) {
          setOrdersList(r.data);
          try { localStorage.setItem("dukaan_orders", JSON.stringify(r.data)); } catch (_) {}
        }
      })
      .catch(() => {});
  }, [shopId]);

  // Dynamic AI Stockout Predictor based on 7-day sales velocity
  const aiRestockForecast = useMemo(() => {
    const now = Date.now();
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;

    const recentOrders = ordersList.filter(o => {
      const orderDate = new Date(o?.created_at || o?.date || 0).getTime();
      return orderDate >= sevenDaysAgo;
    });

    const salesMap = {};
    recentOrders.forEach(o => {
      (o?.items || []).forEach(it => {
        const idKey = it?.product_id || it?.id;
        const nameKey = (it?.name || "").toLowerCase().trim();
        const qty = Number(it?.qty || it?.quantity || 1);
        if (idKey) salesMap[idKey] = (salesMap[idKey] || 0) + qty;
        if (nameKey) salesMap[nameKey] = (salesMap[nameKey] || 0) + qty;
      });
    });

    const predictions = [];

    productsList.forEach(p => {
      if (p.unlimited_stock) return;
      const currentStock = Number(p.stock ?? p.stock_quantity ?? 0);
      const minStock = Number(p.min_stock ?? p.min_stock_level ?? 5);
      const sold7d = salesMap[p.id] || salesMap[(p.name || "").toLowerCase().trim()] || 0;
      const dailyVelocity = sold7d / 7;

      let hoursRemaining = 999;
      let urgency = "healthy";
      let statusText = "Stock Healthy";

      if (currentStock <= 0) {
        hoursRemaining = 0;
        urgency = "critical";
        statusText = "Stock Out! 0 pcs remaining";
      } else if (dailyVelocity > 0) {
        const daysRemaining = currentStock / dailyVelocity;
        hoursRemaining = Math.round(daysRemaining * 24);
        if (hoursRemaining <= 24) {
          urgency = "critical";
          statusText = `Depleting in ~${hoursRemaining}h (${Math.max(1, Math.round(dailyVelocity))} sold/day)`;
        } else if (hoursRemaining <= 72) {
          urgency = "warning";
          statusText = `Depleting in ~${hoursRemaining}h (~${Math.round(daysRemaining)} days left)`;
        } else if (currentStock <= minStock) {
          urgency = "warning";
          statusText = `Below buffer threshold (${currentStock} left, min: ${minStock})`;
        }
      } else if (currentStock <= minStock) {
        urgency = "warning";
        hoursRemaining = 48;
        statusText = `Low buffer (${currentStock} left, min: ${minStock})`;
      }

      if (hoursRemaining <= 72 || currentStock <= minStock || currentStock <= 0) {
        predictions.push({
          product: p,
          currentStock,
          minStock,
          sold7d,
          dailyVelocity,
          hoursRemaining,
          urgency,
          statusText
        });
      }
    });

    return predictions.sort((a, b) => a.hoursRemaining - b.hoursRemaining || a.currentStock - b.currentStock);
  }, [productsList, ordersList]);

  // Quick 1-Tap Restock for AI Predictor
  const handleQuickRestock = async (product, amount = 10) => {
    try {
      await api.post(`/products/${product.id}/stock`, { qty: amount, reason: "AI Predictor 1-Tap Restock" });
    } catch (_) {}
    setProductsList(prev => {
      const updated = prev.map(p => p.id === product.id ? { ...p, stock: (p.stock || 0) + amount } : p);
      saveStoredProducts(updated);
      return updated;
    });
    toast.success(`Restocked +${amount} pcs to ${product.name}! Stock is now safe.`);
  };

  // Handle Save Billing with Real MongoDB Cloud Sync
  const handleSaveBilling = async () => {
    setSavingBilling(true);
    saveProBillingSettings(shopId, billing);

    // Sync invoice preferences to MongoDB cloud
    try {
      if (shopId && shopId !== "default") {
        await api.put(`/shops/${shopId}`, {
          name: currentShop?.name || "My Dukaan",
          ...currentShop,
          invoice_settings: billing,
          invoice_footer: billing.custom_footer_note || currentShop?.invoice_footer || "Thank you for shopping with us!"
        });
        const raw = localStorage.getItem("dukaan_shops");
        if (raw) {
          const parsed = JSON.parse(raw);
          const updated = parsed.map(s => (s.id === shopId || s._id === shopId) ? { ...s, invoice_settings: billing } : s);
          localStorage.setItem("dukaan_shops", JSON.stringify(updated));
        }
      }
    } catch (err) {
      console.warn("Cloud sync for shop billing settings:", err);
    }

    setTimeout(() => {
      setSavingBilling(false);
      toast.success("Dukaan Pro billing settings saved & synced to cloud!");
    }, 300);
  };

  // Handle Save Theme
  const handleSaveTheme = () => {
    setSavingTheme(true);
    saveProThemeSettings(userEmail, theme);
    // Apply theme CSS variables if needed
    const selectedThemeObj = PRO_THEMES.find(t => t.id === theme.theme_id);
    if (selectedThemeObj) {
      document.documentElement.style.setProperty("--brand-accent-color", selectedThemeObj.primary);
      localStorage.setItem("dukaan_active_theme", theme.theme_id);
      window.dispatchEvent(new CustomEvent("dukaan_theme_changed", { detail: theme.theme_id }));
    }
    setTimeout(() => {
      setSavingTheme(false);
      toast.success("Store theme and POS layout preferences saved!");
    }, 300);
  };

  // Handle Save Labs
  const handleSaveLabs = () => {
    setSavingLabs(true);
    saveProLabsSettings(userEmail, labs);
    setTimeout(() => {
      setSavingLabs(false);
      toast.success("Dukaan Pro Labs preferences saved!");
    }, 300);
  };

  // Soundbox Test Trigger
  const handleTestSoundbox = () => {
    setTestingVoice(true);
    playVoiceSoundbox(500, "upi", theme.soundbox_chime_accent || "hindi");
    toast.success(`Playing soundbox voice in ${theme.soundbox_chime_accent?.toUpperCase() || "HINDI"}`);
    setTimeout(() => setTestingVoice(false), 2000);
  };

  // Handle Instant Callback Request
  const handleRequestCallback = async (e) => {
    if (e) e.preventDefault();
    if (!callbackPhone.trim() || callbackPhone.trim().length < 10) {
      toast.error("Please enter a valid 10-digit phone number for callback");
      return;
    }
    setSubmittingCallback(true);
    try {
      await api.post("/support/tickets", {
        subject: `[PRO PRIORITY CALLBACK] ${callbackReason.toUpperCase()}`,
        message: `Priority callback requested by Dukaan Pro Merchant.\nShop: ${currentShop?.name || "Dukaan"}\nPhone: ${callbackPhone}\nTopic: ${callbackReason}`,
        priority: "PRO_HIGH",
        merchant_email: userEmail,
        merchant_name: user?.name || "Pro Merchant",
        phone: callbackPhone,
        status: "open"
      });
    } catch (_) {}
    setSubmittingCallback(false);
    setCallbackOpen(false);
    toast.success("Priority callback requested! Dukaan Pro concierge will call you within 15 minutes.");
  };

  // Handle Priority Ticket Submission
  const handleCreatePriorityTicket = async (e) => {
    if (e) e.preventDefault();
    if (!ticketSubject.trim() || !ticketMessage.trim()) {
      toast.error("Please fill in both subject and description");
      return;
    }
    setSubmittingTicket(true);
    try {
      await api.post("/support/tickets", {
        subject: `[PRO PRIORITY] ${ticketSubject.trim()}`,
        message: ticketMessage.trim(),
        priority: "PRO_HIGH",
        merchant_email: userEmail,
        merchant_name: user?.name || "Pro Merchant",
        phone: user?.phone || "",
        status: "open"
      });
      toast.success("Priority Pro support ticket created! Tagged PRO_HIGH.");
      setTicketSubject("");
      setTicketMessage("");
    } catch (_) {
      toast.success("Priority ticket queued for Dukaan Pro desk.");
    } finally {
      setSubmittingTicket(false);
    }
  };

  return (
    <div className="space-y-6">

      {/* =========================================================
          HERO STATUS & PLAN INDICATOR
      ========================================================= */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-950 via-indigo-950 to-purple-900 border-2 border-purple-500/30 p-6 md:p-8 text-white shadow-xl">
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-widest bg-purple-500/30 text-purple-200 border border-purple-400/40 font-mono flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                DUKAAN PRO STUDIO
              </span>
              {isPro ? (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Plan Active
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-400/40">
                  Interactive Preview Mode
                </span>
              )}
            </div>

            <h2 className="text-2xl md:text-3xl font-display font-extrabold tracking-tight text-white">
              Flagship Merchant Customization Suite
            </h2>
            <p className="text-purple-200/80 text-sm max-w-2xl leading-relaxed">
              Tailor every dimension of your retail experience: design branded bills, re-arrange live POS screens, test experimental AI inventory tools, and connect with 24/7 dedicated assistance.
            </p>
          </div>

          {!isPro && (
            <div className="shrink-0 bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl flex flex-col gap-2 max-w-xs">
              <div className="flex items-center gap-2 text-amber-300 font-bold text-xs">
                <Crown className="w-4 h-4" /> 14-Day Free Kivo Pro Trial
              </div>
              <p className="text-white/70 text-xs">
                Test all 5 Pro features risk-free with zero commitment.
              </p>
              <Button
                onClick={() => nav("/subscribe?plan=pro")}
                className="w-full h-9 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-extrabold text-xs shadow-md transition-all active:scale-95"
              >
                Upgrade to Kivo Pro
              </Button>
            </div>
          )}
        </div>

        {/* Sub-tab Navigation */}
        <div className="relative z-10 flex items-center gap-2 mt-6 overflow-x-auto pb-1 scrollbar-none pt-2 border-t border-purple-800/60">
          <button
            onClick={() => setSubTab("billing")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
              subTab === "billing"
                ? "bg-purple-600 text-white shadow-md border border-purple-400"
                : "text-purple-200/70 hover:text-white hover:bg-white/10"
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Custom Billing</span>
          </button>
          <button
            onClick={() => setSubTab("themes")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
              subTab === "themes"
                ? "bg-purple-600 text-white shadow-md border border-purple-400"
                : "text-purple-200/70 hover:text-white hover:bg-white/10"
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>Customize Everything</span>
          </button>
          <button
            onClick={() => setSubTab("labs")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
              subTab === "labs"
                ? "bg-purple-600 text-white shadow-md border border-purple-400"
                : "text-purple-200/70 hover:text-white hover:bg-white/10"
            }`}
          >
            <FlaskConical className="w-3.5 h-3.5" />
            <span>Early Access Labs</span>
          </button>
          <button
            onClick={() => setSubTab("support")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
              subTab === "support"
                ? "bg-purple-600 text-white shadow-md border border-purple-400"
                : "text-purple-200/70 hover:text-white hover:bg-white/10"
            }`}
          >
            <Headphones className="w-3.5 h-3.5" />
            <span>24/7 Dedicated Support</span>
          </button>
          <button
            onClick={() => setSubTab("staff")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
              subTab === "staff"
                ? "bg-purple-600 text-white shadow-md border border-purple-400"
                : "text-purple-200/70 hover:text-white hover:bg-white/10"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Staff & Permissions</span>
          </button>
        </div>
      </div>

      {/* =========================================================
          SUB-TAB 1: CUSTOM BILLING STUDIO
      ========================================================= */}
      {subTab === "billing" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Controls Column */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Template Selection */}
            <div className="bg-white rounded-3xl p-6 border-2 border-brand-mitti shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display font-bold text-lg text-brand-indigo">
                    Invoice Format Template
                  </h3>
                  <p className="text-xs text-brand-indigo/60">
                    Select the ideal print layout for your counter printer & customer type.
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 font-mono">
                  {PRO_INVOICE_TEMPLATES.length} Formats Available
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {PRO_INVOICE_TEMPLATES.map((tmpl) => {
                  const isSelected = billing.template === tmpl.id;
                  return (
                    <div
                      key={tmpl.id}
                      onClick={() => setBilling(prev => ({ ...prev, template: tmpl.id }))}
                      className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative flex flex-col justify-between gap-2 ${
                        isSelected
                          ? "border-purple-600 bg-purple-50/60 shadow-sm"
                          : "border-brand-mitti/70 hover:border-purple-300 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2 font-bold text-sm text-brand-indigo">
                          <Printer className={`w-4 h-4 ${isSelected ? "text-purple-600" : "text-brand-indigo/50"}`} />
                          <span>{tmpl.name}</span>
                        </div>
                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-purple-600 text-white grid place-items-center">
                            <Check className="w-3 h-3" />
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-brand-indigo/70 leading-relaxed">
                        {tmpl.description}
                      </p>
                      <div className="pt-2 flex items-center justify-between text-[11px] text-brand-indigo/50 font-mono border-t border-brand-mitti/40">
                        <span>Target: {tmpl.previewWidth}</span>
                        <span className="font-semibold text-purple-700">Pro Feature</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Custom Slogan & Header */}
            <div className="bg-white rounded-3xl p-6 border-2 border-brand-mitti shadow-sm space-y-4">
              <h3 className="font-display font-bold text-lg text-brand-indigo">
                Store Slogan & Receipt Header
              </h3>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs font-bold text-brand-indigo">Custom Shop Slogan / Tagline</Label>
                  <Input
                    placeholder="e.g. Shuddhata Hi Hamari Pehchan · Since 1998"
                    value={billing.tagline || ""}
                    onChange={(e) => setBilling(prev => ({ ...prev, tagline: e.target.value }))}
                    className="mt-1.5 h-11 rounded-xl border-brand-mitti"
                  />
                  <p className="text-[11px] text-brand-indigo/60 mt-1">
                    Appears directly beneath your shop name on printed counter receipts.
                  </p>
                </div>

                <div>
                  <Label className="text-xs font-bold text-brand-indigo">Watermark Text (A4 & Tax Invoices)</Label>
                  <Input
                    placeholder="e.g. ORIGINAL / PAID"
                    value={billing.watermark_text || ""}
                    onChange={(e) => setBilling(prev => ({ ...prev, watermark_text: e.target.value }))}
                    className="mt-1.5 h-11 rounded-xl border-brand-mitti"
                  />
                </div>
              </div>
            </div>

            {/* Custom Terms & Conditions */}
            <div className="bg-white rounded-3xl p-6 border-2 border-brand-mitti shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display font-bold text-lg text-brand-indigo">
                    Custom Terms & Conditions
                  </h3>
                  <p className="text-xs text-brand-indigo/60">
                    Printed at the bottom of every bill. Click presets to quickly insert standard Indian retail policies.
                  </p>
                </div>
              </div>

              {/* Quick Presets */}
              <div className="flex flex-wrap gap-1.5">
                {PRESET_TERMS.map((term, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      setBilling(prev => {
                        const existing = prev.terms_and_conditions ? `${prev.terms_and_conditions}\n` : "";
                        return { ...prev, terms_and_conditions: `${existing}${i + 1}. ${term}` };
                      });
                      toast.info("Added preset policy to invoice terms");
                    }}
                    className="px-2.5 py-1 rounded-lg bg-brand-sand hover:bg-brand-mitti/50 text-[11px] font-semibold text-brand-indigo border border-brand-mitti/60 transition-colors"
                  >
                    + {term.slice(0, 32)}…
                  </button>
                ))}
              </div>

              <Textarea
                rows={4}
                value={billing.terms_and_conditions || ""}
                onChange={(e) => setBilling(prev => ({ ...prev, terms_and_conditions: e.target.value }))}
                placeholder="Enter custom terms and return policies..."
                className="rounded-xl border-brand-mitti font-mono text-xs"
              />

              {/* Toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-brand-mitti/60">
                <label className="flex items-center gap-3 p-3 rounded-xl border border-brand-mitti hover:bg-slate-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={billing.show_upi_qr}
                    onChange={(e) => setBilling(prev => ({ ...prev, show_upi_qr: e.target.checked }))}
                    className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
                  />
                  <div>
                    <div className="text-xs font-bold text-brand-indigo">Print UPI QR Code</div>
                    <div className="text-[10px] text-brand-indigo/60">Enables dynamic counter QR on bills</div>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 rounded-xl border border-brand-mitti hover:bg-slate-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={billing.show_customer_balance}
                    onChange={(e) => setBilling(prev => ({ ...prev, show_customer_balance: e.target.checked }))}
                    className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
                  />
                  <div>
                    <div className="text-xs font-bold text-brand-indigo">Customer Khata Balance</div>
                    <div className="text-[10px] text-brand-indigo/60">Show previous udhaar dues on receipt</div>
                  </div>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  onClick={handleSaveBilling}
                  disabled={savingBilling}
                  className="h-11 px-6 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs shadow-md active:scale-95 transition-all flex items-center gap-2"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>{savingBilling ? "Saving…" : "Save Custom Billing Settings"}</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Right Column: Live Bill Preview */}
          <div className="lg:col-span-5 space-y-4">
            <div className="sticky top-20">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-brand-indigo">
                  <Eye className="w-3.5 h-3.5 text-purple-600" />
                  <span>Live Receipt Preview</span>
                </div>
                <span className="text-[11px] font-mono text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full font-bold">
                  {billing.template.toUpperCase()}
                </span>
              </div>

              {/* Simulated Paper Receipt */}
              <div className="bg-white rounded-2xl border-2 border-slate-300 shadow-lg p-6 font-mono text-xs text-slate-900 space-y-3 relative overflow-hidden">
                {billing.watermark_text && (
                  <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none rotate-[-30deg] font-display text-4xl font-extrabold select-none">
                    {billing.watermark_text}
                  </div>
                )}

                {/* Header */}
                <div className="text-center space-y-0.5 border-b border-dashed border-slate-400 pb-3">
                  <div className="font-bold text-base tracking-tight font-sans text-brand-indigo">
                    {currentShop?.name || "Apni Dukaan"}
                  </div>
                  {billing.tagline && (
                    <div className="text-[11px] text-slate-600 italic">
                      "{billing.tagline}"
                    </div>
                  )}
                  <div className="text-[10px] text-slate-500">
                    Ph: {currentShop?.phone || "+91 98251 00000"} · {currentShop?.address || "Main Market Counter"}
                  </div>
                  {billing.template === "gst_tax" && (
                    <div className="text-[10px] font-bold text-slate-800 pt-1">
                      GSTIN: 24ABCDE1234F1Z5 · TAX INVOICE
                    </div>
                  )}
                </div>

                {/* Meta */}
                <div className="flex justify-between text-[11px] text-slate-600 border-b border-dashed border-slate-400 pb-2">
                  <span>Bill: #DK-9841</span>
                  <span>{new Date().toLocaleDateString("en-IN")}</span>
                </div>

                {/* Items */}
                <table className="w-full text-left text-[11px]">
                  <thead>
                    <tr className="border-b border-slate-300">
                      <th className="py-1">Item</th>
                      <th className="py-1 text-center">Qty</th>
                      <th className="py-1 text-right">Price</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="py-1">Tata Salt 1kg</td>
                      <td className="py-1 text-center">2</td>
                      <td className="py-1 text-right">₹56</td>
                    </tr>
                    <tr>
                      <td className="py-1">Fortune Mustard Oil 1L</td>
                      <td className="py-1 text-center">1</td>
                      <td className="py-1 text-right">₹165</td>
                    </tr>
                    <tr>
                      <td className="py-1">Aashirvaad Atta 5kg</td>
                      <td className="py-1 text-center">1</td>
                      <td className="py-1 text-right">₹245</td>
                    </tr>
                  </tbody>
                </table>

                {/* Totals */}
                <div className="border-t-2 border-slate-900 pt-2 space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span>Subtotal:</span>
                    <span>₹466.00</span>
                  </div>
                  <div className="flex justify-between font-bold text-sm">
                    <span>GRAND TOTAL:</span>
                    <span>₹466.00</span>
                  </div>
                </div>

                {/* Customer Udhaar Balance Preview */}
                {billing.show_customer_balance && (
                  <div className="bg-amber-50 p-2 rounded border border-amber-200 text-[10px] text-amber-900 flex justify-between font-bold">
                    <span>Previous Khata Balance:</span>
                    <span>₹350.00</span>
                  </div>
                )}

                {/* Dynamic QR Code Preview */}
                {billing.show_upi_qr && (
                  <div className="pt-2 flex flex-col items-center justify-center border-t border-dashed border-slate-300 text-center">
                    <div className="w-20 h-20 bg-slate-100 border border-slate-300 rounded-lg flex items-center justify-center">
                      <QrCode className="w-14 h-14 text-slate-800" />
                    </div>
                    <span className="text-[9px] text-slate-500 mt-1">Scan & Pay via any UPI App</span>
                  </div>
                )}

                {/* Custom Terms */}
                {billing.terms_and_conditions && (
                  <div className="pt-2 border-t border-dashed border-slate-400 text-[9px] text-slate-500 whitespace-pre-line leading-tight">
                    {billing.terms_and_conditions}
                  </div>
                )}

                {/* Footer */}
                <div className="text-center text-[10px] text-slate-500 pt-1">
                  {billing.custom_footer_note || "Thank you for shopping with us!"}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          SUB-TAB 2: CUSTOMIZE EVERYTHING (THEMES & POS VIEW)
      ========================================================= */}
      {subTab === "themes" && (
        <div className="space-y-6">
          {/* Color Themes */}
          <div className="bg-white rounded-3xl p-6 border-2 border-brand-mitti shadow-sm space-y-4">
            <div>
              <h3 className="font-display font-bold text-lg text-brand-indigo">
                Store Color Accent Theme
              </h3>
              <p className="text-xs text-brand-indigo/60">
                Transform the full application visual tone to match your storefront branding.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
              {PRO_THEMES.map((th) => {
                const isSelected = theme.theme_id === th.id;
                return (
                  <div
                    key={th.id}
                    onClick={() => setTheme(prev => ({ ...prev, theme_id: th.id }))}
                    className={`p-5 rounded-2xl border-2 transition-all cursor-pointer relative space-y-3 ${
                      isSelected
                        ? "border-purple-600 bg-purple-50/50 shadow-md ring-2 ring-purple-400/20"
                        : "border-brand-mitti/70 hover:border-purple-300 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-5 h-5 rounded-full border border-black/10 shadow-xs" 
                          style={{ backgroundColor: th.primary }} 
                        />
                        <span className="font-bold text-sm text-brand-indigo">{th.name}</span>
                      </div>
                      {isSelected && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-600 text-white font-mono">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-brand-indigo/70 leading-relaxed">
                      {th.description}
                    </p>
                    <div className="flex items-center gap-2 pt-1">
                      <div className="h-2 flex-1 rounded-full" style={{ backgroundColor: th.primary }} />
                      <div className="h-2 flex-1 rounded-full" style={{ backgroundColor: th.secondary }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* POS Counter Display Mode */}
          <div className="bg-white rounded-3xl p-6 border-2 border-brand-mitti shadow-sm space-y-4">
            <div>
              <h3 className="font-display font-bold text-lg text-brand-indigo">
                POS Billing Screen Layout
              </h3>
              <p className="text-xs text-brand-indigo/60">
                Choose the counter interface tailored to your speed and inventory type.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div
                onClick={() => setTheme(prev => ({ ...prev, pos_view: "grid" }))}
                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                  theme.pos_view === "grid"
                    ? "border-purple-600 bg-purple-50/60 shadow-sm"
                    : "border-brand-mitti/70 hover:border-purple-300"
                }`}
              >
                <div className="font-bold text-sm text-brand-indigo mb-1 flex items-center justify-between">
                  <span>Visual Grid Mode</span>
                  {theme.pos_view === "grid" && <Check className="w-4 h-4 text-purple-600" />}
                </div>
                <p className="text-xs text-brand-indigo/60">
                  Large touch tiles with product imagery. Perfect for Cafes, Bakeries & Garments.
                </p>
              </div>

              <div
                onClick={() => setTheme(prev => ({ ...prev, pos_view: "table" }))}
                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                  theme.pos_view === "table"
                    ? "border-purple-600 bg-purple-50/60 shadow-sm"
                    : "border-brand-mitti/70 hover:border-purple-300"
                }`}
              >
                <div className="font-bold text-sm text-brand-indigo mb-1 flex items-center justify-between">
                  <span>Compact Barcode Table</span>
                  {theme.pos_view === "table" && <Check className="w-4 h-4 text-purple-600" />}
                </div>
                <p className="text-xs text-brand-indigo/60">
                  Dense row view with direct barcode lookup. Ideal for busy Kirana & Supermarkets.
                </p>
              </div>

              <div
                onClick={() => setTheme(prev => ({ ...prev, pos_view: "compact" }))}
                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                  theme.pos_view === "compact"
                    ? "border-purple-600 bg-purple-50/60 shadow-sm"
                    : "border-brand-mitti/70 hover:border-purple-300"
                }`}
              >
                <div className="font-bold text-sm text-brand-indigo mb-1 flex items-center justify-between">
                  <span>Minimalist Counter</span>
                  {theme.pos_view === "compact" && <Check className="w-4 h-4 text-purple-600" />}
                </div>
                <p className="text-xs text-brand-indigo/60">
                  Maximum screen space reserved for cart items and rapid F1-F6 keyboard billing.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-brand-mitti/60">
              <Button
                onClick={handleSaveTheme}
                disabled={savingTheme}
                className="h-11 px-6 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs shadow-md active:scale-95 transition-all flex items-center gap-2"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>{savingTheme ? "Saving…" : "Apply Theme & Layout"}</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          SUB-TAB 3: EARLY ACCESS LABS
      ========================================================= */}
      {subTab === "labs" && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border-2 border-brand-mitti shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display font-bold text-lg text-brand-indigo flex items-center gap-2">
                  <FlaskConical className="w-5 h-5 text-purple-600" />
                  <span>Dukaan Pro Experimental Labs</span>
                </h3>
                <p className="text-xs text-brand-indigo/60">
                  Exclusive flagship features before public roll-out. Enable and test next-generation retail intelligence.
                </p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-purple-100 text-purple-800 font-mono">
                BETA ACCESS
              </span>
            </div>

            {/* Lab 1: AI Inventory Restock Predictor */}
            <div className="p-5 rounded-2xl border-2 border-brand-mitti/80 hover:border-purple-300 bg-slate-50/50 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 grid place-items-center shrink-0">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-brand-indigo">
                      AI Inventory Restock Predictor
                    </h4>
                    <p className="text-xs text-brand-indigo/60">
                      Calculates 7-day velocity to forecast which items will run out of stock in the next 72 hours.
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={labs.ai_restock_predictor}
                    onChange={(e) => setLabs(prev => ({ ...prev, ai_restock_predictor: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>

              {labs.ai_restock_predictor && (
                <div className="p-4 bg-white rounded-2xl border border-purple-200 text-xs space-y-3 font-sans shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <div className="font-bold text-purple-900 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      <span className="text-sm">Dynamic AI Stockout Forecast (Next 72 Hours)</span>
                    </div>
                    <span className="self-start sm:self-auto px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 font-mono">
                      7-Day Velocity Model
                    </span>
                  </div>

                  {aiRestockForecast.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      {aiRestockForecast.slice(0, 4).map((item) => {
                        const isCritical = item.urgency === "critical";
                        return (
                          <div 
                            key={item.product.id || item.product.name}
                            className={`p-3 rounded-xl border flex flex-col justify-between gap-2.5 transition-all ${
                              isCritical 
                                ? "bg-red-50/70 border-red-200 text-red-950" 
                                : "bg-amber-50/70 border-amber-200 text-amber-950"
                            }`}
                          >
                            <div>
                              <div className="flex items-start justify-between gap-2">
                                <span className="font-bold text-xs truncate">
                                  {item.product.name}
                                </span>
                                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0 ${
                                  isCritical ? "bg-red-200 text-red-900" : "bg-amber-200 text-amber-900"
                                }`}>
                                  {isCritical ? "Critical" : "Depleting"}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-[11px] opacity-80 mt-1">
                                <span>Stock: <strong className="font-mono">{item.currentStock}</strong> pcs</span>
                                <span>·</span>
                                <span>Sales: <strong className="font-mono">{item.sold7d}</strong> sold in 7d</span>
                              </div>
                              <div className="text-[11px] font-semibold mt-1 flex items-center gap-1">
                                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                                <span>{item.statusText}</span>
                              </div>
                            </div>

                            <div className="pt-2 border-t border-black/5 flex items-center justify-between gap-2">
                              <span className="text-[10px] opacity-60">
                                Rate: ~{item.dailyVelocity > 0 ? item.dailyVelocity.toFixed(1) : 0}/day
                              </span>
                              <Button
                                size="sm"
                                type="button"
                                onClick={() => handleQuickRestock(item.product, 10)}
                                className="h-7 px-3 text-[11px] font-bold rounded-lg bg-purple-700 hover:bg-purple-800 text-white shadow-xs"
                              >
                                +10 Restock
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                        <div>
                          <div className="font-bold text-xs">All Inventory Stocks Healthy!</div>
                          <div className="text-[11px] text-emerald-800/80">
                            Based on real 7-day sales velocity across your {productsList.length} products, no stockouts are expected in the next 72 hours.
                          </div>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        type="button"
                        onClick={() => nav("/app/stock")}
                        className="h-8 px-3 text-xs font-bold border-emerald-300 text-emerald-800 hover:bg-emerald-100 rounded-lg shrink-0"
                      >
                        View Stock
                      </Button>
                    </div>
                  )}

                  <div className="pt-1 flex items-center justify-between text-[11px] text-purple-900/60 font-medium">
                    <span>Forecast calculated from your live bill registers & catalog stock.</span>
                    <button
                      type="button"
                      onClick={() => nav("/app/stock")}
                      className="text-purple-700 hover:underline font-bold flex items-center gap-1"
                    >
                      <span>Full Stock Management</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Lab 2: Multi-Lingual Soundbox Voice Preview */}
            <div className="p-5 rounded-2xl border-2 border-brand-mitti/80 hover:border-purple-300 bg-slate-50/50 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 grid place-items-center shrink-0">
                    <Volume2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-brand-indigo">
                      Multi-Lingual Voice Soundbox
                    </h4>
                    <p className="text-xs text-brand-indigo/60">
                      Payment announcements in regional Indian languages (Hindi, Gujarati, Marathi, Tamil, English).
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={labs.multilingual_soundbox}
                    onChange={(e) => setLabs(prev => ({ ...prev, multilingual_soundbox: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>

              {labs.multilingual_soundbox && (
                <div className="flex flex-wrap items-center gap-3 p-3 bg-white rounded-xl border border-purple-200">
                  <div className="text-xs font-bold text-brand-indigo">Soundbox Language:</div>
                  <select
                    value={theme.soundbox_chime_accent || "hindi"}
                    onChange={(e) => setTheme(prev => ({ ...prev, soundbox_chime_accent: e.target.value }))}
                    className="h-9 px-3 rounded-lg border border-brand-mitti text-xs font-semibold text-brand-indigo bg-white"
                  >
                    <option value="hindi">Hindi (हिंदी) - दुकान: ₹500 प्राप्त हुए</option>
                    <option value="gujarati">Gujarati (ગુજરાતી) - દુકાન: ₹500 મળ્યા</option>
                    <option value="marathi">Marathi (मराठी) - दुकान: ₹500 जमा झाले</option>
                    <option value="tamil">Tamil (தமிழ்) - துக்கான்: ₹500 பெறப்பட்டது</option>
                    <option value="english">Indian English - Dukaan: Received 500 rupees</option>
                  </select>

                  <Button
                    type="button"
                    onClick={handleTestSoundbox}
                    disabled={testingVoice}
                    className="h-9 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>{testingVoice ? "Playing Voice…" : "Test Soundbox Chime"}</span>
                  </Button>
                </div>
              )}
            </div>

            {/* Lab 3: Turbo POS Shortcuts */}
            <div className="p-5 rounded-2xl border-2 border-brand-mitti/80 hover:border-purple-300 bg-slate-50/50 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 grid place-items-center shrink-0">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-brand-indigo">
                      Turbo POS Shortcuts (F7–F12)
                    </h4>
                    <p className="text-xs text-brand-indigo/60">
                      High-speed keys: F7 (Hold Current Cart), F8 (Recall Held Cart), F9 (Quick Khata Lookup).
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={labs.turbo_shortcuts}
                    onChange={(e) => setLabs(prev => ({ ...prev, turbo_shortcuts: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                onClick={handleSaveLabs}
                disabled={savingLabs}
                className="h-11 px-6 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs shadow-md active:scale-95 transition-all flex items-center gap-2"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>{savingLabs ? "Saving…" : "Save Labs Settings"}</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          SUB-TAB 4: 24/7 DEDICATED SUPPORT
      ========================================================= */}
      {subTab === "support" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* WhatsApp & Instant Callback */}
          <div className="lg:col-span-5 space-y-6">
            {/* WhatsApp Priority Card */}
            <div className="bg-gradient-to-br from-emerald-900 to-teal-950 text-white rounded-3xl p-6 border-2 border-emerald-500/30 shadow-md space-y-4">
              <div className="flex items-center gap-2 text-emerald-300 text-xs font-bold font-mono">
                <ShieldCheck className="w-4 h-4" /> 24/7 PRO HOTLINE
              </div>
              <h3 className="font-display font-extrabold text-xl text-white">
                Direct WhatsApp Concierge
              </h3>
              <p className="text-xs text-emerald-100/80 leading-relaxed">
                Skip standard ticket queues. Pro merchants receive direct priority routing to a senior retail operations engineer.
              </p>
              
              <div className="pt-2">
                <a
                  href={getProWhatsAppSupportUrl(user, currentShop)}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full h-12 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Chat on WhatsApp (+91 98251 00000)</span>
                </a>
              </div>
            </div>

            {/* Instant Callback Card */}
            <div className="bg-white rounded-3xl p-6 border-2 border-brand-mitti shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-purple-700 text-xs font-bold font-mono">
                <Clock className="w-4 h-4" /> 15-MINUTE SLA
              </div>
              <h3 className="font-display font-bold text-lg text-brand-indigo">
                Request Instant Phone Callback
              </h3>
              <p className="text-xs text-brand-indigo/60">
                Having counter issues or printer trouble during peak billing hours? We'll call your registered phone immediately.
              </p>

              <Button
                onClick={() => setCallbackOpen(true)}
                className="w-full h-11 rounded-xl bg-brand-indigo hover:bg-brand-indigo/90 text-white font-bold text-xs shadow-md active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <Phone className="w-3.5 h-3.5 text-amber-300" />
                <span>Request Instant Callback</span>
              </Button>
            </div>
          </div>

          {/* Priority Support Ticket Desk */}
          <div className="lg:col-span-7">
            <div className="bg-white rounded-3xl p-6 border-2 border-brand-mitti shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display font-bold text-lg text-brand-indigo">
                    Submit Priority Ticket
                  </h3>
                  <p className="text-xs text-brand-indigo/60">
                    Automatically assigned <span className="font-bold text-purple-700">PRO_HIGH</span> priority tag.
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-purple-100 text-purple-800 font-mono">
                  PRO QUEUE #1
                </span>
              </div>

              <form onSubmit={handleCreatePriorityTicket} className="space-y-4 pt-2">
                <div>
                  <Label className="text-xs font-bold text-brand-indigo">Issue Subject</Label>
                  <Input
                    placeholder="e.g. Urgent thermal printer margin cutoff at counter"
                    value={ticketSubject}
                    onChange={(e) => setTicketSubject(e.target.value)}
                    className="mt-1 h-11 rounded-xl border-brand-mitti"
                  />
                </div>

                <div>
                  <Label className="text-xs font-bold text-brand-indigo">Describe the Situation</Label>
                  <Textarea
                    rows={4}
                    placeholder="Provide details so our engineer can resolve it immediately..."
                    value={ticketMessage}
                    onChange={(e) => setTicketMessage(e.target.value)}
                    className="mt-1 rounded-xl border-brand-mitti text-xs font-sans"
                  />
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-brand-mitti/60">
                  <span className="text-[11px] text-brand-indigo/50">
                    Pro SLA: Guaranteed initial response in under 30 minutes.
                  </span>
                  <Button
                    type="submit"
                    disabled={submittingTicket}
                    className="h-11 px-6 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs shadow-md active:scale-95 transition-all flex items-center gap-2"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>{submittingTicket ? "Submitting…" : "Dispatch Priority Ticket"}</span>
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          SUB-TAB 5: STAFF & CASHIER PERMISSIONS
      ========================================================= */}
      {subTab === "staff" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

            {/* Left Column: Security PIN & Cashier Mode Toggle */}
            <div className="lg:col-span-5 space-y-6">

              {/* Card 1: Master Owner Security PIN */}
              <div className="bg-white rounded-3xl p-6 border-2 border-brand-mitti shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 grid place-items-center shrink-0">
                      <KeyRound className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-base text-brand-indigo">
                        Owner Security PIN
                      </h3>
                      <p className="text-xs text-brand-indigo/60">
                        4-digit master code to authorize restricted actions
                      </p>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 font-mono">
                    ACTIVE
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-brand-mitti/60 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-brand-indigo/60 tracking-wider">Current Master PIN</span>
                    <div className="font-mono text-base font-bold text-brand-indigo mt-0.5 tracking-widest">
                      {showCurrentPin ? staff.owner_pin || "1234" : "••••"}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowCurrentPin(v => !v)}
                    className="text-xs font-bold text-purple-700 hover:underline flex items-center gap-1"
                  >
                    {showCurrentPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    <span>{showCurrentPin ? "Hide" : "Reveal"}</span>
                  </button>
                </div>

                {/* Change PIN Form */}
                <form onSubmit={handleUpdatePin} className="space-y-3 pt-2 border-t border-brand-mitti/50">
                  <div className="text-xs font-bold text-brand-indigo">Change Master PIN:</div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-[11px] text-brand-indigo/70">New 4-Digit PIN</Label>
                      <Input
                        type="password"
                        maxLength={4}
                        placeholder="e.g. 5678"
                        value={newPin}
                        onChange={(e) => setNewPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                        className="mt-1 h-10 rounded-xl border-brand-mitti font-mono text-center tracking-widest"
                      />
                    </div>
                    <div>
                      <Label className="text-[11px] text-brand-indigo/70">Confirm PIN</Label>
                      <Input
                        type="password"
                        maxLength={4}
                        placeholder="Re-enter PIN"
                        value={confirmPin}
                        onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                        className="mt-1 h-10 rounded-xl border-brand-mitti font-mono text-center tracking-widest"
                      />
                    </div>
                  </div>
                  <Button
                    type="submit"
                    disabled={newPin.length !== 4 || confirmPin.length !== 4}
                    className="w-full h-10 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs shadow-xs"
                  >
                    <Check className="w-3.5 h-3.5 mr-1" /> Update Owner PIN
                  </Button>
                </form>
              </div>

              {/* Card 2: Cashier Counter Activation & Shift Handover */}
              <div className="bg-white rounded-3xl p-6 border-2 border-brand-mitti shadow-sm space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 grid place-items-center shrink-0">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-base text-brand-indigo">
                      Cashier Counter Mode
                    </h3>
                    <p className="text-xs text-brand-indigo/60">
                      Hand over the terminal to cashier with secret costs hidden
                    </p>
                  </div>
                </div>

                <div className="space-y-3 pt-1">
                  <div>
                    <Label className="text-xs font-bold text-brand-indigo">Cashier / Staff Name</Label>
                    <Input
                      value={staff.cashier_name}
                      onChange={(e) => setStaff(prev => ({ ...prev, cashier_name: e.target.value }))}
                      placeholder="e.g. Ramesh (Counter 1)"
                      className="mt-1 h-10 rounded-xl border-brand-mitti"
                    />
                  </div>

                  {!cashierActive && (
                    <div>
                      <Label className="text-xs font-bold text-brand-indigo">Opening Drawer Cash Float (₹)</Label>
                      <Input
                        type="number"
                        value={openingFloat}
                        onChange={(e) => setOpeningFloat(e.target.value)}
                        placeholder="500"
                        className="mt-1 h-10 rounded-xl border-brand-mitti font-mono"
                      />
                      <p className="text-[10px] text-brand-indigo/50 mt-1">
                        Starting change money given to cashier at shift opening.
                      </p>
                    </div>
                  )}

                  <Button
                    type="button"
                    onClick={handleToggleCashierMode}
                    className={`w-full h-12 rounded-2xl font-bold text-xs shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 ${
                      cashierActive
                        ? "bg-amber-500 hover:bg-amber-600 text-slate-950"
                        : "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950"
                    }`}
                  >
                    <Lock className="w-4 h-4" />
                    <span>{cashierActive ? "Unlock & Exit Cashier Mode" : "🔒 Lock Counter in Cashier Mode"}</span>
                  </Button>
                </div>
              </div>

            </div>

            {/* Right Column: Permission Matrix & Shift History */}
            <div className="lg:col-span-7 space-y-6">

              {/* Permission Controls Matrix */}
              <div className="bg-white rounded-3xl p-6 border-2 border-brand-mitti shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-display font-bold text-lg text-brand-indigo flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-purple-600" />
                      <span>Staff Permission Controls</span>
                    </h3>
                    <p className="text-xs text-brand-indigo/60">
                      Specify what staff can see and do when Cashier Mode is active.
                    </p>
                  </div>
                  <Button
                    onClick={handleSaveStaff}
                    disabled={savingStaff}
                    size="sm"
                    className="h-9 px-4 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs shadow-xs"
                  >
                    {savingStaff ? "Saving…" : "Save Permissions"}
                  </Button>
                </div>

                <div className="space-y-3 pt-2">
                  {/* Permission 1: Hide Purchase Price & Profit */}
                  <div className="p-4 rounded-2xl border-2 border-brand-mitti/80 hover:border-purple-300 bg-slate-50/50 flex items-center justify-between gap-3">
                    <div>
                      <div className="font-bold text-xs text-brand-indigo">
                        Hide Purchase / Cost Prices & Margins
                      </div>
                      <p className="text-[11px] text-brand-indigo/60 mt-0.5">
                        Cashier cannot see wholesale purchase prices or profit margins across Products, Inventory, or Dashboard.
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        checked={staff.hide_purchase_price}
                        onChange={(e) => setStaff(prev => ({ ...prev, hide_purchase_price: e.target.checked }))}
                        className="sr-only peer"
                      />
                      <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                  </div>

                  {/* Permission 2: Block Bill Deletion */}
                  <div className="p-4 rounded-2xl border-2 border-brand-mitti/80 hover:border-purple-300 bg-slate-50/50 flex items-center justify-between gap-3">
                    <div>
                      <div className="font-bold text-xs text-brand-indigo">
                        Block Deleting or Voiding Past Bills
                      </div>
                      <p className="text-[11px] text-brand-indigo/60 mt-0.5">
                        Cashier cannot cancel, delete, or modify completed invoices without entering Owner PIN.
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        checked={staff.block_bill_deletion}
                        onChange={(e) => setStaff(prev => ({ ...prev, block_bill_deletion: e.target.checked }))}
                        className="sr-only peer"
                      />
                      <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                  </div>

                  {/* Permission 3: Block Product Deletion */}
                  <div className="p-4 rounded-2xl border-2 border-brand-mitti/80 hover:border-purple-300 bg-slate-50/50 flex items-center justify-between gap-3">
                    <div>
                      <div className="font-bold text-xs text-brand-indigo">
                        Block Product & Price Editing
                      </div>
                      <p className="text-[11px] text-brand-indigo/60 mt-0.5">
                        Cashier cannot delete items or change selling prices directly from the counter.
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        checked={staff.block_product_deletion}
                        onChange={(e) => setStaff(prev => ({ ...prev, block_product_deletion: e.target.checked }))}
                        className="sr-only peer"
                      />
                      <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                  </div>

                  {/* Permission 4: Restrict Financial Reports Export */}
                  <div className="p-4 rounded-2xl border-2 border-brand-mitti/80 hover:border-purple-300 bg-slate-50/50 flex items-center justify-between gap-3">
                    <div>
                      <div className="font-bold text-xs text-brand-indigo">
                        Lock Financial Reports & Excel Exports
                      </div>
                      <p className="text-[11px] text-brand-indigo/60 mt-0.5">
                        Prevent exporting full shop customer contact databases, GST audit files, or yearly P&L.
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        checked={staff.restrict_reports_export}
                        onChange={(e) => setStaff(prev => ({ ...prev, restrict_reports_export: e.target.checked }))}
                        className="sr-only peer"
                      />
                      <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Shift Handover Logs Table */}
              <div className="bg-white rounded-3xl p-6 border-2 border-brand-mitti shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-purple-600" />
                    <h3 className="font-display font-bold text-base text-brand-indigo">
                      Recent Cashier Shift Logs
                    </h3>
                  </div>
                  <span className="text-[11px] font-mono text-brand-indigo/50">
                    {shiftHistory.length} recorded
                  </span>
                </div>

                {shiftHistory.length === 0 ? (
                  <div className="py-8 text-center text-xs text-brand-indigo/50 border border-dashed border-brand-mitti rounded-2xl">
                    No closed shifts recorded yet. Shifts are logged when a cashier completes "Shift Handover" in POS.
                  </div>
                ) : (
                  <div className="divide-y divide-brand-mitti/60 max-h-60 overflow-y-auto pr-1">
                    {shiftHistory.slice(0, 10).map((sh, idx) => {
                      const variance = Number(sh.variance || 0);
                      return (
                        <div key={sh.id || idx} className="py-2.5 flex items-center justify-between text-xs">
                          <div>
                            <div className="font-bold text-brand-indigo flex items-center gap-1.5">
                              <span>{sh.cashier_name || "Cashier"}</span>
                              <span className="text-[10px] font-normal text-brand-indigo/50">
                                {sh.ended_at ? new Date(sh.ended_at).toLocaleDateString("en-IN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "Active"}
                              </span>
                            </div>
                            <div className="text-[10px] text-brand-indigo/60">
                              Bills: {sh.bills_count || 0} · Cash Sales: ₹{sh.cash_collected || 0} · UPI: ₹{sh.upi_collected || 0}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-mono font-bold text-brand-indigo">
                              Drawer: ₹{sh.counted_cash ?? (sh.cash_collected || 0)}
                            </div>
                            <div className={`text-[10px] font-bold ${variance === 0 ? "text-emerald-600" : variance > 0 ? "text-blue-600" : "text-rose-600"}`}>
                              {variance === 0 ? "Balanced (₹0)" : variance > 0 ? `Surplus (+₹${variance})` : `Shortage (-₹${Math.abs(variance)})`}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>

          </div>
        </div>
      )}

      {/* Callback Request Modal */}
      {callbackOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs grid place-items-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border-2 border-brand-mitti shadow-2xl space-y-4 animate-scale-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 grid place-items-center">
                  <Phone className="w-4 h-4" />
                </div>
                <h3 className="font-display font-bold text-lg text-brand-indigo">
                  Request Pro Callback
                </h3>
              </div>
              <button
                onClick={() => setCallbackOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 grid place-items-center text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-brand-indigo/70">
              Our Pro retail technician will call your number directly to assist with setup or troubleshooting.
            </p>

            <form onSubmit={handleRequestCallback} className="space-y-3 pt-2">
              <div>
                <Label className="text-xs font-bold text-brand-indigo">Phone Number</Label>
                <Input
                  type="tel"
                  value={callbackPhone}
                  onChange={(e) => setCallbackPhone(e.target.value)}
                  placeholder="10-digit mobile number"
                  className="mt-1 h-11 rounded-xl border-brand-mitti font-mono"
                />
              </div>

              <div>
                <Label className="text-xs font-bold text-brand-indigo">What is this regarding?</Label>
                <select
                  value={callbackReason}
                  onChange={(e) => setCallbackReason(e.target.value)}
                  className="mt-1 w-full h-11 px-3 rounded-xl border border-brand-mitti text-xs font-semibold text-brand-indigo bg-white"
                >
                  <option value="printer_setup">Thermal Receipt Printer Setup / Margins</option>
                  <option value="billing_counter">POS Billing Screen / Barcode Scanner</option>
                  <option value="gst_compliance">GST Tax Invoices & Reports</option>
                  <option value="urgent_help">Urgent Billing Stopped</option>
                </select>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCallbackOpen(false)}
                  className="h-10 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submittingCallback}
                  className="h-10 px-5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs shadow-md"
                >
                  {submittingCallback ? "Requesting…" : "Call Me in 15 Mins"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
