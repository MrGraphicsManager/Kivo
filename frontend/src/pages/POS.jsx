import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, money, API_BASE } from "@/lib/api";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { 
  Plus, 
  Minus, 
  Trash2, 
  Search, 
  Banknote, 
  QrCode, 
  Wallet, 
  CreditCard,
  Infinity as InfinityIcon, 
  Sparkles,
  Printer,
  CheckCircle2,
  ArrowRight,
  RotateCcw,
  UserPlus,
  Percent,
  Receipt,
  Store,
  Tag,
  ShoppingBag,
  Zap,
  Volume2,
  VolumeX,
  Share2,
  Crown,
  AlertTriangle,
  ChevronRight,
  X,
  Table as TableIcon,
  LayoutGrid,
  Minimize2,
  PauseCircle,
  PlayCircle,
  ShieldCheck,
  Clock,
  Mic,
  Monitor,
  Split,
  ShoppingCart,
  ScanLine,
  User,
  Star,
  Briefcase,
  ListFilter,
  FileText,
  Bookmark
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import VoiceBillingModal from "@/components/pos/VoiceBillingModal";
import CustomerDisplayModal from "@/components/pos/CustomerDisplayModal";
import SplitPaymentModal from "@/components/pos/SplitPaymentModal";
import { useAuth } from "@/lib/AuthContext";
import { getProThemeSettings } from "@/lib/proCustomizations";
import { 
  isCashierModeActive, 
  getActiveCashierName, 
  getCurrentShift, 
  endCurrentShift 
} from "@/lib/proStaffPermissions";

function ProductCard({ product, inCart, isOutOfStock, onAdd, onUpdateQty }) {
  return (
    <div
      data-testid={`pos-product-${product.id}`}
      className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-3 sm:p-3.5 flex flex-col justify-between hover:border-blue-300 dark:hover:border-slate-700 hover:shadow-md transition-all group select-none"
    >
      <div className="space-y-1.5">
        {/* Category Pill */}
        <div className="flex items-center justify-between gap-1">
          <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider truncate">
            {product.category || "General"}
          </span>
          {product.barcode && (
            <span className="text-[9px] font-mono text-slate-400 dark:text-slate-500">
              #{product.barcode.slice(-4)}
            </span>
          )}
        </div>

        {/* Product Name */}
        <h3 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-2 leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          {product.name}
        </h3>

        {/* Price & Stock */}
        <div className="flex items-baseline justify-between pt-1">
          <div className="text-base font-extrabold text-slate-900 dark:text-white">
            {money(product.selling_price)}
          </div>
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
            isOutOfStock
              ? "bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400"
              : product.stock <= (product.min_stock || 5) && !product.unlimited_stock
              ? "bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400"
              : "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400"
          }`}>
            {isOutOfStock ? "Out of stock" : product.unlimited_stock ? "In stock" : `${product.stock} in stock`}
          </span>
        </div>
      </div>

      {/* Action: + Add or Qty Counter */}
      <div className="mt-3 pt-1 border-t border-slate-100 dark:border-slate-800/80">
        {inCart ? (
          <div className="w-full h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 p-1 flex items-center justify-between text-xs font-bold text-blue-700 dark:text-blue-300">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onUpdateQty(-1); }}
              className="w-7 h-6 rounded-lg bg-white dark:bg-slate-800 border border-blue-100 dark:border-slate-700 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-95 transition-transform"
            >
              -
            </button>
            <span className="font-mono font-extrabold px-2">{inCart.qty}</span>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onUpdateQty(1); }}
              className="w-7 h-6 rounded-lg bg-white dark:bg-slate-800 border border-blue-100 dark:border-slate-700 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-95 transition-transform"
            >
              +
            </button>
          </div>
        ) : (
          <Button
            type="button"
            size="sm"
            disabled={isOutOfStock}
            onClick={(e) => { e.stopPropagation(); onAdd(); }}
            className="w-full h-8 rounded-xl bg-slate-900 hover:bg-blue-600 dark:bg-slate-800 dark:hover:bg-blue-600 text-white font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
          >
            <span>+ Add</span>
          </Button>
        )}
      </div>
    </div>
  );
}

export default function POS() {
  const nav = useNavigate();
  const { lang, user, shops, currentShopId } = useAuth();
  const userPlan = user?.subscription?.plan || "starter";
  const isPremium = userPlan === "premium" || user?.is_premium || user?.is_admin;

  const [products, setProducts] = useState([]);
  const [q, setQ] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [cart, setCart] = useState([]); // {product_id, name, price, qty, unit}
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState("flat"); // "flat" or "percent"
  const [customerId, setCustomerId] = useState("");
  const [customers, setCustomers] = useState([]);
  const [shop, setShop] = useState(null);

  // New Dukaan 3.0 POS States (Matching Screenshot)
  const [customerSearchText, setCustomerSearchText] = useState("");
  const [customerDropdownOpen, setCustomerDropdownOpen] = useState(false);
  const [customerType, setCustomerType] = useState("walkin"); // "walkin", "regular", "business", "custom"
  const [customerListModalOpen, setCustomerListModalOpen] = useState(false);
  const [orderNote, setOrderNote] = useState("");
  const [taxRate, setTaxRate] = useState(0); // 0, 5, 12, 18, 28
  const [taxDialogOpen, setTaxDialogOpen] = useState(false);
  const [discountDialogOpen, setDiscountDialogOpen] = useState(false);

  // Feature #45: Gating for Medical Store on Premium Plan
  const activeShop = (shops || []).find(s => s?.id === currentShopId) || shops?.[0];
  const shopCategory = (activeShop?.store_category || shop?.store_category || "").toLowerCase();
  const isMedicalStore = shopCategory.includes("medical") || shopCategory.includes("pharmacy");
  const canUseExpiryGuard = isPremium && isMedicalStore;
  
  // Soundbox audio state (Premium only)
  const [soundboxEnabled, setSoundboxEnabled] = useState(isPremium);

  // Payment modal state
  const [payOpen, setPayOpen] = useState(false);
  const [method, setMethod] = useState("cash");
  const [amountReceived, setAmountReceived] = useState("");
  const [busy, setBusy] = useState(false);
  
  // Completed bill & WhatsApp state
  const [completedBill, setCompletedBill] = useState(null);
  const [waPhone, setWaPhone] = useState("");
  const [autoResetTimer, setAutoResetTimer] = useState(null);

  // New Customer modal state
  const [newCustomer, setNewCustomer] = useState({ open: false, name: "", phone: "" });

  // Mobile Cart Slide-up Drawer state
  const [mobileCartOpen, setMobileCartOpen] = useState(false);

  // Dukaan Pro: View Mode & Cart Hold/Recall State
  const [posViewMode, setPosViewMode] = useState(() => {
    return getProThemeSettings(user?.email)?.pos_view || "grid";
  });
  const [heldCart, setHeldCart] = useState(() => {
    try {
      const raw = sessionStorage.getItem(`dukaan_held_cart_${currentShopId}`);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  // Shift Handover Modal State (F9)
  const [shiftHandoverOpen, setShiftHandoverOpen] = useState(false);
  const [countedCashInput, setCountedCashInput] = useState("");
  const [shiftStatsServer, setShiftStatsServer] = useState(null);

  const activeCashierName = isCashierModeActive() 
    ? getActiveCashierName(currentShopId) 
    : (user?.name || "Owner");

  const { playAudioChime } = useTheme();

  // Dukaan 3.0 Modals State
  const [voiceModalOpen, setVoiceModalOpen] = useState(false);
  const [customerDisplayOpen, setCustomerDisplayOpen] = useState(false);
  const [splitPaymentOpen, setSplitPaymentOpen] = useState(false);

  // Dukaan 3.0 Multi-Cart Slots (Hold & Switch between 3 concurrent active carts)
  const [activeCartSlot, setActiveCartSlot] = useState(1);
  const [cartSlots, setCartSlots] = useState(() => {
    try {
      const raw = sessionStorage.getItem(`dukaan_cart_slots_${currentShopId}`);
      return raw ? JSON.parse(raw) : {
        1: { cart: [], customerId: "", discount: 0, discountType: "flat" },
        2: { cart: [], customerId: "", discount: 0, discountType: "flat" },
        3: { cart: [], customerId: "", discount: 0, discountType: "flat" }
      };
    } catch {
      return {
        1: { cart: [], customerId: "", discount: 0, discountType: "flat" },
        2: { cart: [], customerId: "", discount: 0, discountType: "flat" },
        3: { cart: [], customerId: "", discount: 0, discountType: "flat" }
      };
    }
  });

  const switchCartSlot = (slotNum) => {
    if (slotNum === activeCartSlot) return;
    const updated = {
      ...cartSlots,
      [activeCartSlot]: { cart, customerId, discount, discountType }
    };
    setCartSlots(updated);
    try {
      sessionStorage.setItem(`dukaan_cart_slots_${currentShopId}`, JSON.stringify(updated));
    } catch {}

    const target = updated[slotNum] || { cart: [], customerId: "", discount: 0, discountType: "flat" };
    setActiveCartSlot(slotNum);
    setCart(target.cart || []);
    setCustomerId(target.customerId || "");
    setDiscount(target.discount || 0);
    setDiscountType(target.discountType || "flat");

    if (playAudioChime) playAudioChime("hold");
    toast.info(`Switched to Cart #${slotNum} (${(target.cart || []).length} items)`);
  };

  const handleHoldCart = () => {
    if (cart.length === 0) {
      toast.info("Cart is empty. Add products before holding bill.");
      return;
    }
    const data = {
      cart: [...cart],
      customerId,
      discount,
      discountType,
      heldAt: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
    };
    sessionStorage.setItem(`dukaan_held_cart_${currentShopId}`, JSON.stringify(data));
    setHeldCart(data);
    setCart([]);
    setDiscount(0);
    setCustomerId("");
    toast.success("⏸️ Current bill held! Ready for next customer. Press [F8] to recall.");
  };

  const handleRecallCart = () => {
    if (!heldCart || !Array.isArray(heldCart.cart) || heldCart.cart.length === 0) {
      toast.info("No held bill found to recall.");
      return;
    }
    setCart(heldCart.cart);
    if (heldCart.customerId) setCustomerId(heldCart.customerId);
    if (heldCart.discount) setDiscount(heldCart.discount);
    if (heldCart.discountType) setDiscountType(heldCart.discountType);
    sessionStorage.removeItem(`dukaan_held_cart_${currentShopId}`);
    setHeldCart(null);
    toast.success(`▶️ Held bill restored with ${heldCart.cart.length} items!`);
  };

  useEffect(() => {
    const handlePosShortcuts = (e) => {
      // F2: AI Voice Billing (Dukaan 3.0)
      if (e.key === "F2") {
        e.preventDefault();
        setVoiceModalOpen(true);
      }
      // F4: Cycle Cart Slot (Dukaan 3.0)
      else if (e.key === "F4") {
        e.preventDefault();
        const next = activeCartSlot === 3 ? 1 : activeCartSlot + 1;
        switchCartSlot(next);
      }
      // F6: Customer Display (Dukaan 3.0)
      else if (e.key === "F6") {
        e.preventDefault();
        setCustomerDisplayOpen(true);
      }
      // F7: Hold Cart
      else if (e.key === "F7") {
        e.preventDefault();
        handleHoldCart();
      }
      // F8: Recall Cart
      else if (e.key === "F8") {
        e.preventDefault();
        handleRecallCart();
      }
      // F9: Shift Handover
      else if (e.key === "F9") {
        e.preventDefault();
        setShiftHandoverOpen(true);
      }
    };
    window.addEventListener("keydown", handlePosShortcuts);
    return () => window.removeEventListener("keydown", handlePosShortcuts);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart, customerId, discount, discountType, heldCart, currentShopId, activeCartSlot, cartSlots]);

  // Shift Handover Summary (F9) — aggregated server-side from authoritative orders.
  const currentShift = getCurrentShift() || {
    cashier_name: activeCashierName,
    started_at: new Date().toISOString(),
    opening_cash: 0
  };

  useEffect(() => {
    if (!shiftHandoverOpen || !currentShift?.started_at) return;
    let cancelled = false;
    api.get("/orders/shift-summary", { params: { started_at: currentShift.started_at } })
      .then(res => {
        if (!cancelled) setShiftStatsServer(res?.data || null);
      })
      .catch(() => {
        if (!cancelled) setShiftStatsServer(null);
      });
    return () => { cancelled = true; };
  }, [shiftHandoverOpen, currentShift?.started_at]);

  const shiftStats = useMemo(() => {
    const cashSales = Number(shiftStatsServer?.cash_sales || 0);
    const upiSales = Number(shiftStatsServer?.upi_sales || 0);
    const cardSales = Number(shiftStatsServer?.card_sales || 0);
    const udhaarSales = Number(shiftStatsServer?.udhaar_sales || 0);
    const totalSales = Number(shiftStatsServer?.total_sales || 0);
    const totalBills = Number(shiftStatsServer?.total_bills || 0);
    const openingCash = Number(currentShift?.opening_cash || 0);
    const expectedCash = openingCash + cashSales;
    const countedCash = countedCashInput === "" ? expectedCash : Number(countedCashInput) || 0;
    const variance = countedCash - expectedCash;

    return { cashSales, upiSales, cardSales, udhaarSales, totalSales, totalBills, openingCash, expectedCash, countedCash, variance };
  }, [shiftStatsServer, currentShift?.opening_cash, countedCashInput]);

  const handlePrintHandoverSlip = () => {
    const shopName = shop?.name || activeShop?.name || "Apni Dukaan";
    const shopPhone = shop?.phone || activeShop?.phone || "";
    const printWin = window.open("", "_blank", "width=380,height=600");
    if (!printWin) {
      toast.error("Please allow popups to print shift handover slip.");
      return;
    }

    const varianceText = shiftStats.variance === 0 
      ? "PERFECT (BALANCED)" 
      : shiftStats.variance > 0 
        ? `+Rs.${shiftStats.variance.toFixed(2)} SURPLUS (EXTRA)` 
        : `-Rs.${Math.abs(shiftStats.variance).toFixed(2)} SHORTAGE (KAM)`;

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Shift Handover - ${activeCashierName}</title>
          <style>
            body { font-family: 'Courier New', Courier, monospace; font-size: 12px; margin: 0; padding: 14px; width: 80mm; }
            .center { text-align: center; }
            .dashed { border-top: 1px dashed #000; margin: 8px 0; }
            .bold { font-weight: bold; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            td { padding: 2px 0; }
            .right { text-align: right; }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          <div class="center bold" style="font-size: 16px;">${shopName}</div>
          <div class="center" style="font-size: 11px;">${shopPhone}</div>
          <div class="dashed"></div>
          <div class="center bold">SHIFT HANDOVER REPORT</div>
          <div class="center" style="font-size: 11px;">Cashier: ${activeCashierName}</div>
          <div class="center" style="font-size: 10px;">Shift: ${new Date(currentShift?.started_at || Date.now()).toLocaleTimeString("en-IN")} to ${new Date().toLocaleTimeString("en-IN")}</div>
          <div class="dashed"></div>
          <table>
            <tr><td>Total Bills Issued:</td><td class="right bold">${shiftStats.totalBills}</td></tr>
            <tr><td>Total Revenue:</td><td class="right bold">Rs. ${shiftStats.totalSales.toFixed(2)}</td></tr>
            <tr><td colspan="2" class="dashed"></td></tr>
            <tr><td>Opening Drawer Float:</td><td class="right">Rs. ${shiftStats.openingCash.toFixed(2)}</td></tr>
            <tr><td>Cash Collected:</td><td class="right">Rs. ${shiftStats.cashSales.toFixed(2)}</td></tr>
            <tr><td>Digital / UPI:</td><td class="right">Rs. ${shiftStats.upiSales.toFixed(2)}</td></tr>
            <tr><td>Card / Other:</td><td class="right">Rs. ${shiftStats.cardSales.toFixed(2)}</td></tr>
            <tr><td>Udhaar / Credit:</td><td class="right">Rs. ${shiftStats.udhaarSales.toFixed(2)}</td></tr>
            <tr><td colspan="2" class="dashed"></td></tr>
            <tr><td class="bold">Expected Drawer Cash:</td><td class="right bold">Rs. ${shiftStats.expectedCash.toFixed(2)}</td></tr>
            <tr><td class="bold">Actual Counted Cash:</td><td class="right bold">Rs. ${shiftStats.countedCash.toFixed(2)}</td></tr>
            <tr style="font-size: 13px;"><td class="bold">Variance Status:</td><td class="right bold">${varianceText}</td></tr>
          </table>
          <div class="dashed"></div>
          <br/><br/>
          <table style="margin-top: 15px;">
            <tr>
              <td class="center" style="width: 50%;">________________<br/>Cashier Signature</td>
              <td class="center" style="width: 50%;">________________<br/>Owner Signature</td>
            </tr>
          </table>
          <div class="dashed"></div>
          <div class="center" style="font-size: 10px; margin-top: 6px;">
            Dukaan Pro Security & Shift Ledger
          </div>
        </body>
      </html>
    `);
    printWin.document.close();
  };

  const handleShareShiftWhatsApp = () => {
    const shopName = shop?.name || activeShop?.name || "Apni Dukaan";
    const varianceStatus = shiftStats.variance === 0 
      ? "✅ Balanced (0 Variance)" 
      : shiftStats.variance > 0 
        ? `🟢 +₹${shiftStats.variance.toFixed(2)} Surplus (Extra)` 
        : `🔴 -₹${Math.abs(shiftStats.variance).toFixed(2)} Shortage (Kam)`;

    const msg = `📊 *SHIFT HANDOVER REPORT*\\n` +
      `*Store:* ${shopName}\\n` +
      `*Cashier:* ${activeCashierName}\\n` +
      `*Shift:* ${new Date(currentShift?.started_at || Date.now()).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })} - ${new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}\\n` +
      `------------------------------\\n` +
      `• Bills Issued: ${shiftStats.totalBills}\\n` +
      `• Total Revenue: ₹${shiftStats.totalSales.toFixed(2)}\\n` +
      `• Cash Collected: ₹${shiftStats.cashSales.toFixed(2)}\\n` +
      `• Digital / UPI: ₹${shiftStats.upiSales.toFixed(2)}\\n` +
      `------------------------------\\n` +
      `💵 *Opening Cash:* ₹${shiftStats.openingCash.toFixed(2)}\\n` +
      `📥 *Expected Cash:* ₹${shiftStats.expectedCash.toFixed(2)}\\n` +
      `🤝 *Counted Cash:* ₹${shiftStats.countedCash.toFixed(2)}\\n` +
      `⚖️ *Variance:* ${varianceStatus}\\n` +
      `------------------------------\\n` +
      `_Logged via Dukaan Pro POS_`;

    const ownerPhone = (shop?.phone || activeShop?.phone || "").replace(/\\D/g, "");
    const url = `https://wa.me/${ownerPhone ? `91${ownerPhone}` : ""}?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank");
    toast.success("Opening WhatsApp with Shift Report...");
  };

  const handleFinalizeShift = () => {
    endCurrentShift(currentShopId, {
      ...shiftStats,
      shift_duration: `${new Date(currentShift?.started_at || Date.now()).toLocaleTimeString("en-IN")} - ${new Date().toLocaleTimeString("en-IN")}`
    });
    setShiftHandoverOpen(false);
    toast.success("✅ Shift closed successfully! Counter locked.");
  };

  useEffect(() => {
    Promise.all([api.get("/products"), api.get("/customers"), api.get("/shops")])
      .then(([productsRes, customersRes, shopsRes]) => {
        setProducts(Array.isArray(productsRes.data) ? productsRes.data : []);
        setCustomers(Array.isArray(customersRes.data) ? customersRes.data : []);
        const list = Array.isArray(shopsRes.data) ? shopsRes.data : [];
        setShop(list.find(s => s.id === currentShopId) || list[0] || null);
      })
      .catch(() => {
        setProducts([]);
        setCustomers([]);
      });
  }, [currentShopId]);


  // Compute categories (Matching Mockup)
  const categories = useMemo(() => {
    const base = [
      "All",
      "Kirana & Grains",
      "Edible Oil & Ghee",
      "Dairy & Eggs",
      "Biscuits & Snacks",
      "Spices & Masala",
      "Beverages & Tea"
    ];
    const set = new Set(base);
    products.forEach(p => {
      if (p.category) set.add(p.category.trim());
    });
    return Array.from(set);
  }, [products]);

  const matchingCustomers = useMemo(() => {
    if (!customerSearchText) return customers.slice(0, 8);
    const text = customerSearchText.toLowerCase();
    return customers.filter(c => 
      c.name?.toLowerCase().includes(text) || 
      c.phone?.includes(text)
    ).slice(0, 8);
  }, [customers, customerSearchText]);

  // Filtered products by search & category
  const filtered = useMemo(() => {
    let list = products;
    if (selectedCategory !== "All") {
      list = list.filter(p => (p.category || "").toLowerCase() === selectedCategory.toLowerCase());
    }
    const s = q.trim().toLowerCase();
    if (!s) return list;
    return list.filter(p => 
      p.name.toLowerCase().includes(s) || 
      (p.category || "").toLowerCase().includes(s)
    );
  }, [products, q, selectedCategory]);

  // Cart operations (Dukaan 3.0 Hyper-Engine)
  const addToCart = (p, extraQty = 1) => {
    const isUnlimited = p.unlimited_stock === true;
    const availableStock = Number(p.stock !== undefined ? p.stock : 9999);

    if (!isUnlimited && availableStock <= 0) {
      toast.error(`"${p.name}" is out of stock!`);
      return;
    }

    if (playAudioChime) playAudioChime("scan");

    // Feature #45: Expiry verification on item scan / addition
    if (canUseExpiryGuard && p.expiry_date) {
      const exp = new Date(p.expiry_date);
      if (!isNaN(exp.getTime())) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const expZero = new Date(exp);
        expZero.setHours(0, 0, 0, 0);
        const diffDays = Math.ceil((expZero.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays < 0) {
          toast.error(`⚠️ EXPIRED MEDICINE ALERT: "${p.name}" expired ${Math.abs(diffDays)} days ago (${p.expiry_date}). Do not dispense!`, {
            duration: 6000
          });
        } else if (diffDays <= 30) {
          toast.warning(`⚠️ NEAR EXPIRY WARNING: "${p.name}" expires in ${diffDays} days (${p.expiry_date}).`, {
            duration: 4000
          });
        }
      }
    }

    setCart(prev => {
      const idx = prev.findIndex(x => x.product_id === p.id);
      if (idx >= 0) {
        const currentQty = prev[idx].qty;
        if (!isUnlimited && currentQty + extraQty > availableStock) {
          toast.warning(`Cannot add more! Only ${availableStock} units available in stock for ${p.name}.`);
          return prev;
        }
        const copy = [...prev];
        copy[idx] = { ...copy[idx], qty: currentQty + extraQty };
        return copy;
      }
      return [...prev, { 
        product_id: p.id, 
        name: p.name, 
        price: p.selling_price, 
        qty: extraQty, 
        category: p.category,
        batch_number: p.batch_number || "",
        expiry_date: p.expiry_date || "",
        max_stock: isUnlimited ? 99999 : availableStock,
        unlimited_stock: isUnlimited
      }];
    });
  };

  const handleVoiceAddItems = (detectedItems) => {
    if (!Array.isArray(detectedItems) || detectedItems.length === 0) return;
    detectedItems.forEach(({ product, qty }) => {
      addToCart(product, qty || 1);
    });
    toast.success(`⚡ Added ${detectedItems.length} items via AI Voice!`);
  };

  const updateQty = (idx, delta) => {
    setCart(prev => {
      const item = prev[idx];
      if (!item) return prev;
      const copy = [...prev];
      const newQty = item.qty + delta;
      if (newQty <= 0) {
        return copy.filter((_, i) => i !== idx);
      }
      if (delta > 0) {
        const prod = products.find(p => p.id === item.product_id);
        const isUnlimited = prod?.unlimited_stock === true || item.unlimited_stock === true;
        const maxLimit = isUnlimited ? 99999 : Number(prod?.stock ?? item.max_stock ?? 9999);
        if (!isUnlimited && newQty > maxLimit) {
          toast.warning(`Cannot exceed available stock (${maxLimit} units) for ${item.name}!`);
          return prev;
        }
      }
      copy[idx] = { ...copy[idx], qty: newQty };
      return copy;
    });
  };

  const removeItem = (idx) => {
    setCart(prev => prev.filter((_, i) => i !== idx));
  };

  const clearCart = () => {
    setCart([]);
    setDiscount(0);
    setCustomerId("");
  };

  const createCustomer = async () => {
    if (!newCustomer.name.trim()) {
      toast.error("Customer name is required");
      return;
    }

    try {
      const res = await api.post("/customers", {
        name: newCustomer.name.trim(),
        phone: newCustomer.phone.trim(),
        notes: "Added from POS"
      });
      const created = res?.data;
      if (!created?.id) throw new Error("Customer was not created");

      setCustomers(prev => [created, ...prev.filter(c => c.id !== created.id)]);
      setCustomerId(created.id);
      setNewCustomer({ open: false, name: "", phone: "" });
      toast.success(`Customer "${created.name}" added and selected!`);
    } catch (error) {
      toast.error(error?.response?.data?.detail || "Unable to create customer");
    }
  };
  // Pricing math
  const subtotal = cart.reduce((acc, it) => acc + (it.price * it.qty), 0);
  const discountAmount = discountType === "percent" 
    ? Math.round((subtotal * Number(discount || 0)) / 100)
    : Number(discount || 0);
  const taxAmount = Math.round((Math.max(0, subtotal - discountAmount) * Number(taxRate || 0)) / 100);
  const total = Math.max(0, subtotal - discountAmount + taxAmount);

  // Selected customer details
  const selectedCustomerObj = customers.find(c => c.id === customerId);

  // Server-authoritative checkout
  const handleCompleteBill = async () => {
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }
    if (method === "udhaar" && !customerId) {
      toast.error("Please select a customer for Udhaar");
      return;
    }
    if (method === "cash" && Number(amountReceived || 0) < total) {
      toast.error("Amount received cannot be less than the bill total");
      return;
    }

    setBusy(true);
    try {
      const payload = {
        items: cart.map(item => ({
          product_id: item.product_id,
          name: item.name,
          price: Number(item.price || 0),
          qty: Number(item.qty || 0)
        })),
        discount: Number(discountAmount || 0),
        customer_id: customerId || null,
        payment_method: method,
        amount_received: method === "cash" ? Number(amountReceived || total) : null,
        note: orderNote || ""
      };

      const res = await api.post("/orders", payload);
      const serverOrder = res?.data;
      if (!serverOrder?.id) throw new Error("Server did not return an order");

      const billData = {
        ...serverOrder,
        order_no: serverOrder.order_no || `OD-${String(serverOrder.id).slice(-4)}`,
        items: cart,
        total: Number(serverOrder.total ?? total),
        payment_method: method,
        customer_name: selectedCustomerObj?.name || "Walk-in Customer",
        customer_phone: selectedCustomerObj?.phone || "",
        change: method === "cash" ? Math.max(0, Number(amountReceived || 0) - total) : 0,
        billed_by: activeCashierName
      };

      setPayOpen(false);
      setCompletedBill(billData);
      setWaPhone(selectedCustomerObj?.phone || "");
      setProducts(prev => prev.map(p => {
        const item = cart.find(ci => ci.product_id === p.id);
        if (!item || p.unlimited_stock) return p;
        return { ...p, stock: Math.max(0, Number(p.stock || 0) - Number(item.qty || 0)) };
      }));

      toast.success(`Bill #${billData.order_no} created successfully!`);
      if (soundboxEnabled && isPremium && localStorage.getItem("dukaan_payment_alert_chime") !== "false") {
        playVoiceSoundbox(billData.total, method, lang);
      }

      const timer = setTimeout(() => {
        setCompletedBill(null);
        clearCart();
      }, 6000);
      setAutoResetTimer(timer);
    } catch (error) {
      toast.error(error?.response?.data?.detail || "Unable to create bill. Nothing was charged.");
    } finally {
      setBusy(false);
    }
  };

  // Dukaan 3.0 Split Payment Processor
  const handleSplitPaymentConfirm = ({ payment_mode, split }) => {
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }

    const orderId = `ord_${Date.now()}`;
    const orderNo = `OD-${Date.now().toString().slice(-4)}`;
    const now = new Date();

    const order = {
      id: orderId,
      order_no: orderNo,
      total,
      subtotal,
      discount: discountAmount,
      payment_method: "split",
      split_breakdown: split,
      status: split.khata > 0 ? "partial_udhaar" : "paid",
      pending_amount: split.khata || 0,
      paid_amount: (split.cash || 0) + (split.upi || 0) + (split.card || 0),
      customer_id: split.khata_customer_id || customerId || null,
      customer_name: selectedCustomerObj?.name || "Split Payment Customer",
      customer_phone: selectedCustomerObj  // Split payment is not persisted locally. Until the backend supports split tender atomically,
  // route the user through the standard server-authoritative checkout instead.
  const handleSplitPaymentConfirm = () => {
    setSplitPaymentOpen(false);
    toast.error("Split payment is temporarily unavailable. Use Cash, UPI, or Udhaar.");
  };

  const handleSendWhatsAppBill = (billToShare) => {
    const b = billToShare || completedBill;
    if (!b) return;
    const phone = (waPhone || b.customer_phone || "").replace(/\D/g, "");
    const shopName = shop?.name || "Apni Dukaan";
    const itemsText = (b.items || []).map(it => `• ${it.name} x ${it.qty} = ₹${Number(it.price || it.selling_price || 0) * Number(it.qty || 1)}`).join("\n");
    const msg = `🧾 *${shopName}* — Digital Cash Memo\n` +
      `Bill #${b.order_no}\n` +
      `------------------------------\n` +
      `${itemsText}\n` +
      `------------------------------\n` +
      `*Grand Total: ₹${b.total}*\n` +
      `Paid Via: ${b.payment_method?.toUpperCase()}\n` +
      `Date: ${new Date().toLocaleDateString("en-IN")}\n\n` +
      `Thank you for shopping with us! Please visit again. 🙏\n` +
      `_Powered by Dukaan · A PEAN Product_`;

    const url = `https://wa.me/${phone ? `91${phone}` : ""}?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank");
    toast.success("Opening WhatsApp...");
  };

  // Feature 16 & Dukaan Pro Custom Billing: Master Thermal & Custom Receipt Engine
  const handlePrintReceipt = (billToPrint) => {
    const b = billToPrint || completedBill;
    if (!b) return;
    const proBilling = getProBillingSettings(currentShopId);
    const brandingEnabled = localStorage.getItem("dukaan_receipt_branding_enabled") !== "false";
    const shopName = shop?.name || activeShop?.name || "Apni Dukaan";
    const shopPhone = shop?.phone || activeShop?.phone || "";
    const tagline = proBilling?.tagline || "";
    const terms = proBilling?.terms_and_conditions || "";
    const showUpi = proBilling?.show_upi_qr;
    const isThermalCompact = proBilling?.template === "thermal_compact";
    const isTaxInvoice = proBilling?.template === "gst_tax";
    const isA4 = proBilling?.template === "modern_a4";

    const cust = customers.find(c => (c.id && c.id === b.customer_id) || (c.phone && b.customer_phone && c.phone === b.customer_phone));
    const prevUdhaar = cust ? Number(cust.total_pending || 0) : 0;

    const itemsHtml = (b.items || []).map(it => `
      <tr>
        <td style="padding: 3px 0; text-align: left;">${it.name} x${it.qty}</td>
        <td style="padding: 3px 0; text-align: right; font-family: monospace;">₹${Number(it.price || it.selling_price || 0) * Number(it.qty || 1)}</td>
      </tr>
    `).join("");

    const printWin = window.open("", "_blank", isA4 ? "width=800,height=900" : "width=380,height=600");
    if (!printWin) {
      toast.error("Please allow popups to print thermal receipts.");
      return;
    }

    const printWidth = isA4 ? "210mm" : isThermalCompact ? "58mm" : "80mm";
    const fontSize = isThermalCompact ? "11px" : isA4 ? "14px" : "12px";

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Receipt #${b.order_no}</title>
          <style>
            @media print {
              body { margin: 0; padding: 10px; font-family: 'Courier New', Courier, monospace; font-size: ${fontSize}; color: #000; width: ${printWidth}; }
              .center { text-align: center; }
              .dashed { border-top: 1px dashed #000; margin: 8px 0; }
              .bold { font-weight: bold; }
            }
            body { font-family: 'Courier New', Courier, monospace; font-size: ${fontSize}; margin: 0; padding: 14px; width: ${printWidth}; max-width: ${isA4 ? "100%" : "80mm"}; }
            .center { text-align: center; }
            .dashed { border-top: 1px dashed #000; margin: 8px 0; }
            .bold { font-weight: bold; }
            table { width: 100%; border-collapse: collapse; font-size: ${fontSize}; }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          <div class="center bold" style="font-size: ${isA4 ? '20px' : '16px'};">${shopName}</div>
          ${tagline ? `<div class="center" style="font-size: 11px; font-style: italic; color: #444;">${tagline}</div>` : ""}
          <div class="center" style="font-size: 11px;">${shopPhone ? `Ph: ${shopPhone}` : ""}</div>
          ${isTaxInvoice ? `<div class="center bold" style="font-size: 11px; margin-top: 2px;">TAX INVOICE · GSTIN: 24ABCDE1234F1Z5</div>` : ""}
          <div class="dashed"></div>
          <div>Bill No: #${b.order_no}</div>
          <div>Date: ${new Date().toLocaleDateString("en-IN")} ${new Date().toLocaleTimeString("en-IN", { hour: '2-digit', minute: '2-digit' })}</div>
          <div>Customer: ${b.customer_name || "Walk-in"}</div>
          <div class="dashed"></div>
          <table>
            <thead>
              <tr style="border-bottom: 1px dashed #000;">
                <th style="text-align: left; padding-bottom: 4px;">Item</th>
                <th style="text-align: right; padding-bottom: 4px;">Amt</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
          <div class="dashed"></div>
          <table>
            <tr>
              <td class="bold">GRAND TOTAL:</td>
              <td class="bold" style="text-align: right; font-size: 14px;">₹${b.total}</td>
            </tr>
            <tr>
              <td>Payment Mode:</td>
              <td style="text-align: right; text-transform: uppercase;">${b.payment_method}</td>
            </tr>
            ${b.change > 0 ? `<tr><td>Change Returned:</td><td style="text-align: right;">₹${b.change}</td></tr>` : ""}
            ${(proBilling?.show_customer_balance && prevUdhaar > 0) ? `
              <tr>
                <td style="color: #666;">Previous Khata Dues:</td>
                <td style="text-align: right; font-weight: bold; color: #b45309;">₹${prevUdhaar}</td>
              </tr>
            ` : ""}
          </table>
          ${showUpi ? `
            <div class="dashed"></div>
            <div class="center" style="font-size: 10px; margin: 4px 0;">
              <b>Scan UPI to Pay</b><br/>
              ${shop?.upi_id ? `<span style="font-family: monospace;">UPI: ${shop.upi_id}</span>` : ""}
            </div>
          ` : ""}
          ${terms ? `
            <div class="dashed"></div>
            <div style="font-size: 9px; color: #444; white-space: pre-line; line-height: 1.3;">
              ${terms}
            </div>
          ` : ""}
          <div class="dashed"></div>
          <div class="center">${proBilling?.custom_footer_note || "Thank you for visiting! 🙏"}</div>
          ${brandingEnabled ? `
            <div class="center" style="font-size: 9px; margin-top: 12px; color: #555;">
              *** Powered by Dukaan · A PEAN Product ***<br/>
              Smart Thermal POS Engine
            </div>
          ` : ""}
          <div style="height: 20px;"></div>
        </body>
      </html>
    `);
    printWin.document.close();
  };

  const handlePrintTestDiagnostic = () => {
    const printWin = window.open("", "_blank", "width=380,height=500");
    if (!printWin) {
      toast.error("Please allow popups to run printer test.");
      return;
    }
    printWin.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>POS Diagnostic Test</title>
          <style>
            body { font-family: monospace; font-size: 12px; padding: 10px; width: 58mm; text-align: center; }
            .line { border-top: 1px dashed #000; margin: 6px 0; }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          <div style="font-weight: bold; font-size: 14px;">DUKAAN PRINTER TEST</div>
          <div>58mm / 80mm ESC/POS OK</div>
          <div class="line"></div>
          <div>Left Margin: OK [0]</div>
          <div>Right Margin: OK [32 Col]</div>
          <div>Feed & Cut Test: PASS</div>
          <div class="line"></div>
          <div>Date: ${new Date().toLocaleString("en-IN")}</div>
          <div style="margin-top: 10px;">OfficialDukaan.in Hardware Guard</div>
          <div style="height: 30px;">.</div>
        </body>
      </html>
    `);
    printWin.document.close();
    toast.success("Diagnostic receipt dispatched to thermal spooler!");
  };

  // Feature 18: Universal FMCG Barcode Scanner Auto-match in POS
  const fmcgMatched = useMemo(() => {
    if (!q || q.trim().length < 4) return null;
    return findFMCGByBarcode(q.trim());
  }, [q]);

  const handleAddFmcgDirect = (item) => {
    addToCart({
      id: `fmcg_${item.barcode}`,
      name: item.name,
      selling_price: item.selling_price,
      stock: 99,
      unlimited_stock: true,
      category: item.category
    });
    setQ("");
    toast.success(`⚡ Added "${item.name}" directly to cart!`);
  };

  const handleManualReset = () => {
    if (autoResetTimer) clearTimeout(autoResetTimer);
    setCompletedBill(null);
    clearCart();
  };

  return (
    <div className="animate-fade-up max-w-[1600px] mx-auto pb-32 lg:pb-12 font-sans space-y-5">
      
      {/* =========================================================
          TOP BANNER: NEW BILL TITLE & KEYBOARD SHORTCUTS
      ========================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/20 shrink-0">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
              New Bill
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Create a new bill and add products to get started
            </p>
          </div>
        </div>

        {/* Shortcuts & Utility Buttons (F1 Search, F2 Customer, F3 Hold, Voice Bill) */}
        <div className="flex flex-wrap items-center gap-2">
          <button 
            type="button"
            onClick={() => document.getElementById("pos-product-search-input")?.focus()}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <span className="font-mono text-[10px] font-bold bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">F1</span>
            <span>Search</span>
          </button>

          <button 
            type="button"
            onClick={() => document.getElementById("pos-customer-search-input")?.focus()}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <span className="font-mono text-[10px] font-bold bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">F2</span>
            <span>Customer</span>
          </button>

          <button 
            type="button"
            onClick={handleHoldCart}
            disabled={cart.length === 0}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <span className="font-mono text-[10px] font-bold bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">F3</span>
            <span>Hold</span>
          </button>

          {heldCart && (
            <button
              type="button"
              onClick={handleRecallCart}
              className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 animate-pulse cursor-pointer"
            >
              <span>Recall ({heldCart.cart?.length || 1})</span>
            </button>
          )}

          {/* Quick Voice Billing Button */}
          <button
            type="button"
            onClick={() => setVoiceModalOpen(true)}
            className="hidden sm:flex px-3 py-1.5 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/70 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 text-xs font-bold items-center gap-1.5 hover:bg-blue-100 transition-colors cursor-pointer"
            title="AI Voice Billing"
          >
            <Mic className="w-3.5 h-3.5 animate-pulse" />
            <span>Voice Bill</span>
          </button>
        </div>
      </div>

      {/* =========================================================
          MAIN 2-COLUMN WORKSPACE: LEFT CATALOG, RIGHT CURRENT BILL
      ========================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* =========================================================
            LEFT COLUMN: CUSTOMER KHATA + PRODUCT CATALOG GRID
        ========================================================= */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-4">
          
          {/* CARD 1: Customer / Khata (Optional) */}
          <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-2xs space-y-3.5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Customer / Khata (Optional)
              </h2>
              <button
                type="button"
                onClick={() => setNewCustomer({ open: true, name: "", phone: "" })}
                className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>+ Add New</span>
              </button>
            </div>

            {/* Customer Search Bar with Dropdown Autocomplete */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <Input
                id="pos-customer-search-input"
                value={customerSearchText}
                onChange={(e) => {
                  setCustomerSearchText(e.target.value);
                  setCustomerDropdownOpen(true);
                }}
                onFocus={() => setCustomerDropdownOpen(true)}
                placeholder="Search customer by name or phone..."
                className="pl-10 pr-8 h-11 rounded-2xl border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 text-sm"
              />
              {customerSearchText && (
                <button
                  type="button"
                  onClick={() => {
                    setCustomerId("");
                    setCustomerSearchText("");
                    setCustomerType("walkin");
                    setCustomerDropdownOpen(false);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}

              {/* Dropdown Options */}
              {customerDropdownOpen && matchingCustomers.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-30 max-h-52 overflow-y-auto p-1.5 divide-y divide-slate-100 dark:divide-slate-800">
                  {matchingCustomers.map(c => (
                    <div
                      key={c.id}
                      onClick={() => {
                        setCustomerId(c.id);
                        setCustomerSearchText(`${c.name} (${c.phone || "No phone"})`);
                        setCustomerType("custom");
                        setCustomerDropdownOpen(false);
                        toast.success(`Customer selected: ${c.name}`);
                      }}
                      className="p-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl cursor-pointer flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white">{c.name}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{c.phone || "No phone"}</div>
                      </div>
                      {(c.total_pending || 0) > 0 ? (
                        <span className="text-[10px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
                          Due: {money(c.total_pending)}
                        </span>
                      ) : (
                        <span className="text-[10px] text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
                          Clean
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Customer Pills (Walk-in, Regular, Business, Choose from list) */}
            <div className="flex flex-wrap items-center gap-2 pt-0.5">
              <button
                type="button"
                onClick={() => {
                  setCustomerId("");
                  setCustomerSearchText("");
                  setCustomerType("walkin");
                  setCustomerDropdownOpen(false);
                }}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  !customerId && customerType === "walkin"
                    ? "bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 font-bold"
                    : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Walk-in Customer</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setCustomerType("regular");
                  if (customers.length > 0) {
                    const reg = customers[0];
                    setCustomerId(reg.id);
                    setCustomerSearchText(`${reg.name} (${reg.phone || "No phone"})`);
                    setCustomerDropdownOpen(false);
                  } else {
                    toast.info("No customers found. Click '+ Add New' to save one.");
                  }
                }}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  customerType === "regular"
                    ? "bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 font-bold"
                    : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                <Star className="w-3.5 h-3.5" />
                <span>Regular Customer</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setCustomerType("business");
                  const biz = customers.find(c => c.notes?.toLowerCase().includes("business") || c.notes?.toLowerCase().includes("gst"));
                  if (biz) {
                    setCustomerId(biz.id);
                    setCustomerSearchText(`${biz.name} (${biz.phone || "No phone"})`);
                    setCustomerDropdownOpen(false);
                  } else {
                    setNewCustomer({ open: true, name: "Business Client", phone: "" });
                  }
                }}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  customerType === "business"
                    ? "bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 font-bold"
                    : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                <Briefcase className="w-3.5 h-3.5" />
                <span>Business Customer</span>
              </button>

              <button
                type="button"
                onClick={() => setCustomerListModalOpen(true)}
                className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <ListFilter className="w-3.5 h-3.5" />
                <span>Choose from list</span>
              </button>
            </div>
          </div>

          {/* CARD 2: Product Catalog & 4-Column Grid */}
          <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-2xs space-y-4">
            
            {/* Category Filter Pills (Matching Mockup) */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {categories.map((cat) => {
                const isActive = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all shrink-0 cursor-pointer ${
                      isActive
                        ? "bg-blue-600 text-white font-bold shadow-xs shadow-blue-600/20"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>

            {/* Product Search Bar with Barcode Scanner Icon */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <Input
                id="pos-product-search-input"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search products by name, barcode or scan..."
                className="pl-10 pr-11 h-11 rounded-2xl border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 text-sm"
              />
              <button
                type="button"
                onClick={() => document.getElementById("pos-product-search-input")?.focus()}
                className="w-8 h-8 rounded-xl absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 flex items-center justify-center transition-colors cursor-pointer"
                title="Barcode Scanner Ready"
              >
                <ScanLine className="w-4 h-4" />
              </button>
            </div>

            {/* Universal FMCG Barcode Scanner Banner (If Matched) */}
            {fmcgMatched && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl flex items-center justify-between gap-3 text-xs animate-fade-up">
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">⚡</span>
                  <div>
                    <div className="font-bold text-amber-950 dark:text-amber-200 flex items-center gap-1.5">
                      <span>FMCG Master Match: {fmcgMatched.name}</span>
                      <span className="text-[10px] bg-amber-200 text-amber-900 px-1.5 py-0.2 rounded font-mono font-bold">₹{fmcgMatched.selling_price}</span>
                    </div>
                    <div className="text-[11px] text-amber-800 dark:text-amber-300">
                      MRP ₹{fmcgMatched.mrp} · {fmcgMatched.category}
                    </div>
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => handleAddFmcgDirect(fmcgMatched)}
                  className="h-8 px-3.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl shadow-xs shrink-0"
                >
                  + Add to Cart
                </Button>
              </div>
            )}

            {/* 4-Column Responsive Product Grid (Matching Mockup) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 pt-1">
              {filtered.length === 0 ? (
                <div className="col-span-full text-center py-12 bg-slate-50 dark:bg-slate-800/40 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 p-8">
                  <ShoppingBag className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                  <h3 className="font-bold text-base text-slate-800 dark:text-white">No products found</h3>
                  <p className="text-xs text-slate-400 mt-1">Try a different search term or add products to your catalog.</p>
                  <Button 
                    onClick={() => nav("/app/products")}
                    className="mt-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold"
                  >
                    + Add Product to Catalog
                  </Button>
                </div>
              ) : (
                filtered.map(p => {
                  const inCart = cart.find(x => x.product_id === p.id);
                  const isOutOfStock = !p.unlimited_stock && p.stock <= 0;

                  return (
                    <ProductCard
                      key={p.id}
                      product={p}
                      inCart={inCart}
                      isOutOfStock={isOutOfStock}
                      onAdd={() => addToCart(p)}
                      onUpdateQty={(delta) => updateQty(cart.findIndex(x => x.product_id === p.id), delta)}
                    />
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* =========================================================
            RIGHT COLUMN: CURRENT BILL CART SIDEBAR (MATCHING MOCKUP)
        ========================================================= */}
        <div className="w-full lg:col-span-5 xl:col-span-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 shadow-2xs sticky top-20 flex flex-col justify-between">
          
          <div>
            {/* Header: Current Bill & Live POS Badge */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Current Bill
                </h2>
                <span className="bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>Live POS</span>
                </span>
              </div>
            </div>

            {/* Subheader: Items (0) & Clear All */}
            <div className="flex items-center justify-between pt-3 pb-2 text-xs">
              <span className="font-bold text-slate-700 dark:text-slate-300">
                Items ({cart.reduce((a, c) => a + c.qty, 0)})
              </span>
              {cart.length > 0 && (
                <button
                  type="button"
                  onClick={clearCart}
                  className="font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Clear All</span>
                </button>
              )}
            </div>

            {/* Middle: Empty Cart Illustration OR Cart Items List */}
            {cart.length === 0 ? (
              <div className="py-12 sm:py-16 flex flex-col items-center justify-center text-center select-none">
                <div className="w-20 h-20 rounded-3xl bg-blue-50/80 dark:bg-blue-950/40 text-blue-500 dark:text-blue-400 flex items-center justify-center mb-3 shadow-2xs">
                  <ShoppingCart className="w-10 h-10 stroke-[1.5]" />
                </div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-white">Your cart is empty</h3>
                <p className="text-xs text-slate-400 dark:text-slate-500 max-w-[210px] mt-1 leading-relaxed">
                  Search and add products from the left to create a bill.
                </p>
              </div>
            ) : (
              <div className="max-h-[260px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 pr-1 -mr-1">
                {cart.map((item, idx) => (
                  <div key={idx} className="py-2.5 flex items-center justify-between gap-2 text-xs">
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-slate-900 dark:text-white truncate">{item.name}</div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">{money(item.price)} each</div>
                    </div>

                    {/* Qty Controls */}
                    <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800 px-1.5 py-0.5 rounded-xl border border-slate-200 dark:border-slate-700">
                      <button
                        type="button"
                        onClick={() => updateQty(idx, -1)}
                        className="w-5 h-5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center font-bold text-slate-700 dark:text-slate-200"
                      >
                        -
                      </button>
                      <span className="font-mono font-extrabold w-4 text-center text-slate-900 dark:text-white">{item.qty}</span>
                      <button
                        type="button"
                        onClick={() => updateQty(idx, 1)}
                        className="w-5 h-5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center font-bold text-slate-700 dark:text-slate-200"
                      >
                        +
                      </button>
                    </div>

                    <div className="font-bold text-slate-900 dark:text-white text-right w-14 font-mono">
                      {money(item.price * item.qty)}
                    </div>

                    <button
                      type="button"
                      onClick={() => removeItem(idx)}
                      className="text-slate-300 hover:text-rose-500 p-0.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Quick Note Input Box */}
            <div className="relative mt-3">
              <FileText className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={orderNote}
                onChange={(e) => setOrderNote(e.target.value)}
                placeholder="Add a quick note (optional)..."
                className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Bottom Calculations Breakdown (Matching Mockup) */}
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>Items</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">
                {cart.reduce((a, c) => a + c.qty, 0)}
              </span>
            </div>

            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>Subtotal</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">
                {money(subtotal)}
              </span>
            </div>

            <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
              <div className="flex items-center gap-1.5">
                <span>Discount</span>
                <button
                  type="button"
                  onClick={() => setDiscountDialogOpen(true)}
                  className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                >
                  <span>+ Add</span>
                </button>
              </div>
              <span className="font-mono font-bold text-slate-900 dark:text-white">
                {discountAmount > 0 ? `-${money(discountAmount)}` : money(0)}
              </span>
            </div>

            <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
              <div className="flex items-center gap-1.5">
                <span>Tax (GST)</span>
                <button
                  type="button"
                  onClick={() => setTaxDialogOpen(true)}
                  className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                >
                  <span>+ Add</span>
                </button>
              </div>
              <span className="font-mono font-bold text-slate-900 dark:text-white">
                {taxAmount > 0 ? `+${money(taxAmount)}` : money(0)}
              </span>
            </div>

            {/* Total Amount */}
            <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-baseline justify-between">
              <span className="text-sm font-bold text-slate-900 dark:text-white">Total Amount</span>
              <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                {money(total)}
              </span>
            </div>

            {/* Action Buttons: Proceed to Payment, Save as Draft, Print Bill */}
            <div className="pt-3 space-y-2.5">
              <button
                type="button"
                disabled={cart.length === 0}
                onClick={() => {
                  setMethod("cash");
                  setAmountReceived(String(total));
                  setPayOpen(true);
                }}
                data-testid="pos-proceed-payment"
                className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-sm shadow-md shadow-blue-600/25 flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer disabled:cursor-not-allowed"
              >
                <CreditCard className="w-4 h-4" />
                <span>Proceed to Payment</span>
                <span>→</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleHoldCart}
                  disabled={cart.length === 0}
                  className="flex-1 py-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-40"
                >
                  <Bookmark className="w-3.5 h-3.5 text-slate-400" />
                  <span>Save as Draft</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (cart.length === 0) {
                      toast.error("Cart is empty");
                      return;
                    }
                    handlePrintReceipt({
                      cart,
                      total,
                      order_no: `EST-${Date.now().toString().slice(-4)}`,
                      payment_method: "ESTIMATE",
                      created_at: new Date().toISOString()
                    }, selectedCustomerObj?.name || "Walk-in Customer");
                  }}
                  disabled={cart.length === 0}
                  className="flex-1 py-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-40"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-400" />
                  <span>Print Bill</span>
                </button>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* =========================================================
          DIALOG: DISCOUNT ADJUSTMENT
      ========================================================= */}
      <Dialog open={discountDialogOpen} onOpenChange={setDiscountDialogOpen}>
        <DialogContent className="max-w-sm rounded-3xl p-6 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Tag className="w-4 h-4 text-blue-600" />
              <span>Add Bill Discount</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2 text-xs">
            <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setDiscountType("flat")}
                className={`flex-1 py-1.5 rounded-lg font-bold transition-all ${
                  discountType === "flat" ? "bg-white dark:bg-slate-900 text-blue-600 shadow-xs" : "text-slate-600 dark:text-slate-400"
                }`}
              >
                ₹ Flat Amount
              </button>
              <button
                type="button"
                onClick={() => setDiscountType("percent")}
                className={`flex-1 py-1.5 rounded-lg font-bold transition-all ${
                  discountType === "percent" ? "bg-white dark:bg-slate-900 text-blue-600 shadow-xs" : "text-slate-600 dark:text-slate-400"
                }`}
              >
                % Percentage
              </button>
            </div>
            <div>
              <Label className="text-[11px] font-bold uppercase text-slate-500">
                {discountType === "flat" ? "Discount Value (₹)" : "Discount Percentage (%)"}
              </Label>
              <Input
                type="number"
                min="0"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                placeholder="0"
                className="mt-1 h-11 rounded-xl text-base font-bold font-mono"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDiscount(0)} className="rounded-xl font-bold text-xs">
              Clear
            </Button>
            <Button onClick={() => setDiscountDialogOpen(false)} className="rounded-xl bg-blue-600 text-white font-bold text-xs">
              Apply Discount
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* =========================================================
          DIALOG: TAX (GST) ADJUSTMENT
      ========================================================= */}
      <Dialog open={taxDialogOpen} onOpenChange={setTaxDialogOpen}>
        <DialogContent className="max-w-sm rounded-3xl p-6 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Percent className="w-4 h-4 text-blue-600" />
              <span>Tax / GST Rate</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2 text-xs">
            <div className="grid grid-cols-5 gap-2">
              {[0, 5, 12, 18, 28].map(rate => (
                <button
                  key={rate}
                  type="button"
                  onClick={() => setTaxRate(rate)}
                  className={`py-2 rounded-xl font-bold font-mono border transition-all ${
                    Number(taxRate) === rate
                      ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                      : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100"
                  }`}
                >
                  {rate}%
                </button>
              ))}
            </div>
            <div>
              <Label className="text-[11px] font-bold uppercase text-slate-500">Custom Tax Rate (%)</Label>
              <Input
                type="number"
                min="0"
                value={taxRate}
                onChange={(e) => setTaxRate(Number(e.target.value) || 0)}
                placeholder="0"
                className="mt-1 h-11 rounded-xl text-base font-bold font-mono"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setTaxRate(0)} className="rounded-xl font-bold text-xs">
              No Tax
            </Button>
            <Button onClick={() => setTaxDialogOpen(false)} className="rounded-xl bg-blue-600 text-white font-bold text-xs">
              Apply Tax
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* =========================================================
          DIALOG: CHOOSE CUSTOMER FROM LIST
      ========================================================= */}
      <Dialog open={customerListModalOpen} onOpenChange={setCustomerListModalOpen}>
        <DialogContent className="max-w-md rounded-3xl p-6 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900 dark:text-white flex items-center justify-between">
              <span>Select Customer</span>
              <button
                onClick={() => {
                  setCustomerListModalOpen(false);
                  setNewCustomer({ open: true, name: "", phone: "" });
                }}
                className="text-xs font-bold text-blue-600 hover:underline"
              >
                + Add New
              </button>
            </DialogTitle>
          </DialogHeader>
          <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 pr-1 my-2">
            {customers.map(c => (
              <div
                key={c.id}
                onClick={() => {
                  setCustomerId(c.id);
                  setCustomerSearchText(`${c.name} (${c.phone || "No phone"})`);
                  setCustomerType("custom");
                  setCustomerListModalOpen(false);
                  toast.success(`Customer selected: ${c.name}`);
                }}
                className="py-3 px-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl cursor-pointer flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">{c.name}</div>
                  <div className="text-[11px] text-slate-400 font-mono mt-0.5">{c.phone || "No phone registered"}</div>
                </div>
                {(c.total_pending || 0) > 0 ? (
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-200">
                    Udhaar: {money(c.total_pending)}
                  </span>
                ) : (
                  <span className="text-[10px] text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
                    Settled
                  </span>
                )}
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCustomerListModalOpen(false)} className="rounded-xl font-bold text-xs w-full">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* =========================================================
          PAYMENT MODAL (Cash / UPI / Card / Udhaar)
      ========================================================= */}
      <Dialog open={payOpen} onOpenChange={setPayOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto rounded-3xl p-5 sm:p-6 border-2 border-brand-mitti">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl text-brand-indigo flex items-center justify-between">
              <span>Payment Mode</span>
              <span className="font-display text-2xl text-brand-terracotta font-extrabold">{money(total)}</span>
            </DialogTitle>
          </DialogHeader>

          {/* Payment Method Selector Tabs */}
          <div className="grid grid-cols-4 gap-2 mt-4">
            {[
              { id: "cash", label: "Cash", icon: Banknote, color: "bg-emerald-50 text-emerald-700" },
              { id: "upi", label: "UPI QR", icon: QrCode, color: "bg-blue-50 text-blue-700" },
              { id: "card", label: "Card", icon: CreditCard, color: "bg-purple-50 text-purple-700" },
              { id: "udhaar", label: "Udhaar", icon: Wallet, color: "bg-orange-50 text-brand-terracotta" },
            ].map((pm) => {
              const isSelected = method === pm.id;
              const Icon = pm.icon;
              return (
                <button
                  key={pm.id}
                  onClick={() => setMethod(pm.id)}
                  className={`p-3 rounded-2xl border-2 flex flex-col items-center justify-center gap-1.5 transition-all ${
                    isSelected 
                      ? "border-brand-terracotta bg-white shadow-sm" 
                      : "border-brand-mitti bg-brand-sand/50 hover:bg-white"
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isSelected ? "text-brand-terracotta" : "text-brand-indigo/60"}`} />
                  <span className={`text-xs font-bold ${isSelected ? "text-brand-indigo" : "text-brand-indigo/70"}`}>
                    {pm.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Dukaan 3.0 Smart Split Payment Button */}
          <div className="mt-3">
            <button
              type="button"
              onClick={() => {
                setPayOpen(false);
                setSplitPaymentOpen(true);
              }}
              className="w-full py-2.5 px-3 rounded-2xl border-2 border-dashed border-amber-300 bg-amber-50/70 hover:bg-amber-100/70 text-amber-900 font-bold text-xs flex items-center justify-center gap-2 transition active:scale-[0.98]"
            >
              <Split className="w-4 h-4 text-amber-600" />
              <span>Smart Split Payment · Cash + UPI + Khata (Dukaan 3.0)</span>
            </button>
          </div>

          {/* CASH MODE SPECIFIC */}
          {method === "cash" && (
            <div className="mt-5 space-y-4">
              <div>
                <Label className="text-xs uppercase font-bold text-brand-indigo/70">
                  Amount Received from Customer
                </Label>
                <Input
                  type="number"
                  value={amountReceived}
                  onChange={(e) => setAmountReceived(e.target.value)}
                  placeholder={String(total)}
                  className="mt-1.5 h-12 text-xl font-bold font-mono rounded-xl border-brand-mitti"
                />
              </div>

              {/* Quick Cash Denomination Buttons */}
              <div className="flex items-center gap-2">
                {[total, 100, 200, 500, 2000].filter(n => n >= total || n === total).map((amt, i) => (
                  <button
                    key={i}
                    onClick={() => setAmountReceived(String(amt))}
                    className="px-2.5 py-1 rounded-lg bg-brand-sand border border-brand-mitti text-xs font-bold hover:border-brand-indigo"
                  >
                    {amt === total ? "Exact" : `₹${amt}`}
                  </button>
                ))}
              </div>

              {/* Change Return Box */}
              {Number(amountReceived) > total && (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-800 uppercase">Change to Return:</span>
                  <span className="font-display font-extrabold text-2xl text-emerald-700">
                    {money(Number(amountReceived) - total)}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* UPI MODE SPECIFIC */}
          {method === "upi" && (
            <div className="mt-4 text-center space-y-3">
              <div className="text-xs text-brand-indigo/60 font-medium">Customer will scan & pay with any UPI App:</div>
              <div className="w-52 h-52 mx-auto bg-white p-3 rounded-2xl border-2 border-brand-mitti shadow-md grid place-items-center">
                {shop?.upi_qr_data_url ? (
                  <img src={shop.upi_qr_data_url} alt="UPI QR" className="w-full h-full object-contain" />
                ) : shop?.upi_id ? (
                  <img src={`${API_BASE}/upi/qr?amount=${total}`} alt="UPI QR" className="w-full h-full object-contain" />
                ) : (
                  <div className="text-center p-4">
                    <QrCode className="w-16 h-16 text-brand-indigo/40 mx-auto mb-2" />
                    <span className="text-xs text-brand-indigo/70 font-semibold">Ready for UPI Scan</span>
                  </div>
                )}
              </div>
              {shop?.upi_id && (
                <div className="text-xs font-mono font-bold text-brand-indigo bg-brand-sand py-1 px-3 rounded-full inline-block border border-brand-mitti">
                  UPI ID: {shop.upi_id}
                </div>
              )}
            </div>
          )}

          {/* UDHAAR MODE SPECIFIC */}
          {method === "udhaar" && (
            <div className="mt-4 space-y-3">
              <div className="p-3 rounded-xl bg-orange-50 border border-orange-200 text-xs text-orange-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-brand-terracotta shrink-0" />
                <span>This bill of <b>{money(total)}</b> will be added to the customer's pending Udhaar Khata.</span>
              </div>
              {!customerId || customerId === "none" ? (
                <div className="p-4 rounded-xl bg-orange-50/70 border border-orange-200 text-xs text-brand-indigo space-y-2.5">
                  <span className="font-bold text-brand-indigo block">Select Customer for Udhaar:</span>
                  <Select value={customerId} onValueChange={setCustomerId}>
                    <SelectTrigger className="bg-white border-brand-mitti rounded-xl h-10 text-xs font-medium">
                      <SelectValue placeholder="Choose registered customer..." />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name} {c.phone && `· ${c.phone}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <button
                    type="button"
                    onClick={() => setNewCustomer({ open: true, name: "", phone: "" })}
                    className="text-xs font-bold text-brand-terracotta hover:underline flex items-center gap-1 pt-1"
                  >
                    <UserPlus className="w-3.5 h-3.5" /> + Create New Customer
                  </button>
                </div>
              ) : (
                <div className="p-3.5 rounded-2xl bg-brand-sand border border-brand-mitti text-xs space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-brand-indigo/60">Debtor:</span>
                    <span className="font-bold text-brand-indigo text-sm">{selectedCustomerObj?.name}</span>
                  </div>
                  {selectedCustomerObj?.phone && (
                    <div className="flex justify-between items-center text-brand-indigo/70 font-mono">
                      <span>Phone:</span>
                      <span>{selectedCustomerObj.phone}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-1 border-t border-brand-mitti/60">
                    <span className="text-brand-indigo/60">Current Outstanding:</span>
                    <span className="font-bold text-brand-terracotta">{money(selectedCustomerObj?.total_pending || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-1 border-t border-brand-mitti/60 text-emerald-800 font-bold">
                    <span>New Total After This Bill:</span>
                    <span>{money(Number(selectedCustomerObj?.total_pending || 0) + total)}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="mt-6 gap-2">
            <Button
              variant="ghost"
              onClick={() => setPayOpen(false)}
              className="rounded-full text-brand-indigo/60"
            >
              Cancel
            </Button>
            <Button
              disabled={busy || (method === "udhaar" && (!customerId || customerId === "none"))}
              onClick={handleCompleteBill}
              className="rounded-full bg-brand-terracotta hover:bg-brand-terracotta/90 text-white font-bold flex-1 h-12 shadow-md"
            >
              {busy ? "Generating Bill..." : "Confirm & Save Bill"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* =========================================================
          POST-BILL CELEBRATION & PRINT DIALOG (AUTO-RESET READY)
      ========================================================= */}
      <Dialog open={!!completedBill} onOpenChange={(o) => !o && handleManualReset()}>
        <DialogContent className="max-w-md rounded-3xl p-8 border-2 border-brand-mitti text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 grid place-items-center mx-auto mb-4 animate-bounce">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <DialogTitle className="font-display text-3xl font-extrabold text-brand-indigo">
            Bill Ready!
          </DialogTitle>
          <p className="text-sm text-brand-indigo/70 mt-1">
            Bill <b>#{completedBill?.order_no}</b> created successfully.
          </p>

          <div className="my-6 p-4 rounded-2xl bg-brand-sand border border-brand-mitti text-left space-y-2 text-xs">
            <div className="flex justify-between font-medium">
              <span>Total Paid:</span>
              <span className="font-bold text-base text-brand-indigo">{money(completedBill?.total)}</span>
            </div>
            <div className="flex justify-between text-brand-indigo/60">
              <span>Payment Mode:</span>
              <span className="uppercase font-bold">{completedBill?.payment_method}</span>
            </div>
            {completedBill?.change > 0 && (
              <div className="flex justify-between text-emerald-700 font-bold pt-1 border-t border-brand-mitti/60">
                <span>Change Returned:</span>
                <span>{money(completedBill.change)}</span>
              </div>
            )}
          </div>

          {/* WhatsApp Digital Bill Sender */}
          <div className="mb-5 p-3.5 rounded-2xl bg-emerald-50 border-2 border-emerald-200 text-left space-y-2">
            <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Share2 className="w-3.5 h-3.5 text-emerald-700" />
                <span>1-Tap WhatsApp Digital Bill</span>
              </span>
              <span className="text-[10px] bg-emerald-200/70 text-emerald-800 px-1.5 py-0.5 rounded font-bold">Paperless</span>
            </div>
            <div className="flex gap-2">
              <Input
                type="tel"
                placeholder="Customer Mobile (e.g. 9876543210)"
                value={waPhone}
                onChange={(e) => {
                  if (autoResetTimer) clearTimeout(autoResetTimer);
                  setWaPhone(e.target.value);
                }}
                className="h-10 text-xs rounded-xl bg-white border-emerald-300 font-mono"
              />
              <Button
                onClick={() => handleSendWhatsAppBill()}
                className="h-10 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shrink-0 flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
              >
                <span>Send Bill</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>

          <div className="space-y-2.5">
            <Button
              onClick={() => handlePrintReceipt(completedBill)}
              className="w-full h-12 rounded-full bg-brand-terracotta hover:bg-brand-terracotta/90 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm"
            >
              <Printer className="w-4 h-4" /> 🖨️ Print 58mm/80mm Thermal Slip
            </Button>

            <Button
              onClick={() => {
                if (completedBill?.id) nav(`/app/orders/${completedBill.id}`);
              }}
              className="w-full h-12 rounded-full bg-brand-indigo hover:bg-brand-indigo/90 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm"
            >
              <Receipt className="w-4 h-4" /> View Printable Invoice
            </Button>

            <Button
              variant="outline"
              onClick={handleManualReset}
              className="w-full h-12 rounded-full border-2 border-brand-mitti hover:border-brand-indigo text-brand-indigo font-bold text-sm"
            >
              + New Bill (Next Customer)
            </Button>
          </div>

          <div className="mt-4 text-[11px] text-brand-indigo/60 flex items-center justify-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-brand-terracotta" />
            <span>Ready for next customer · Auto-refreshing in a moment</span>
          </div>
        </DialogContent>
      </Dialog>

      {/* =========================================================
          NEW CUSTOMER MODAL
      ========================================================= */}
      <Dialog open={newCustomer.open} onOpenChange={(o) => setNewCustomer({ ...newCustomer, open: o })}>
        <DialogContent className="max-w-sm rounded-3xl p-6 border-2 border-brand-mitti">
          <DialogHeader>
            <DialogTitle className="font-display text-xl text-brand-indigo">Add Customer</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div>
              <Label className="text-xs font-bold text-brand-indigo/70">Full Name</Label>
              <Input
                value={newCustomer.name}
                onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                placeholder="e.g. Ramesh Bhai"
                className="rounded-xl border-brand-mitti mt-1"
              />
            </div>
            <div>
              <Label className="text-xs font-bold text-brand-indigo/70">Phone Number (10 Digits)</Label>
              <Input
                value={newCustomer.phone}
                onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                placeholder="e.g. 9825100000"
                className="rounded-xl border-brand-mitti mt-1"
              />
            </div>
          </div>
          <DialogFooter className="mt-5 gap-2">
            <Button variant="ghost" onClick={() => setNewCustomer({ open: false, name: "", phone: "" })}>
              Cancel
            </Button>
            <Button onClick={createCustomer} className="rounded-full bg-brand-terracotta text-white font-bold">
              Save Customer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* =========================================================
          SHIFT HANDOVER & CASH RECONCILIATION MODAL (F9)
      ========================================================= */}
      <Dialog open={shiftHandoverOpen} onOpenChange={setShiftHandoverOpen}>
        <DialogContent className="max-w-md rounded-3xl p-6 border-2 border-brand-mitti shadow-2xl">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="font-display text-xl text-brand-indigo flex items-center gap-2">
                  Shift Handover & Drawer
                </DialogTitle>
                <p className="text-xs text-brand-indigo/60">
                  Cashier: <strong className="text-brand-indigo">{activeCashierName}</strong> · Started: {new Date(currentShift?.started_at || Date.now()).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 my-2">
            {/* Shift Sales Metric Grid */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-3 rounded-2xl bg-brand-sand/60 border border-brand-mitti">
                <span className="text-[11px] font-bold text-brand-indigo/60 uppercase">Total Bills</span>
                <p className="text-lg font-extrabold text-brand-indigo font-display">{shiftStats.totalBills}</p>
              </div>
              <div className="p-3 rounded-2xl bg-brand-sand/60 border border-brand-mitti">
                <span className="text-[11px] font-bold text-brand-indigo/60 uppercase">Total Revenue</span>
                <p className="text-lg font-extrabold text-brand-indigo font-display">{money(shiftStats.totalSales)}</p>
              </div>
              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200">
                <span className="text-[11px] font-bold text-emerald-800 uppercase">Cash Collected</span>
                <p className="text-lg font-extrabold text-emerald-700 font-display">{money(shiftStats.cashSales)}</p>
              </div>
              <div className="p-3 rounded-2xl bg-purple-50 border border-purple-200">
                <span className="text-[11px] font-bold text-purple-800 uppercase">UPI / Digital</span>
                <p className="text-lg font-extrabold text-purple-700 font-display">{money(shiftStats.upiSales)}</p>
              </div>
            </div>

            {/* Cash Drawer Reconciliation */}
            <div className="p-4 rounded-2xl bg-white border-2 border-brand-mitti space-y-3">
              <div className="flex items-center justify-between text-xs font-medium text-brand-indigo/70">
                <span>Opening Cash Float:</span>
                <span className="font-mono font-bold text-brand-indigo">{money(shiftStats.openingCash)}</span>
              </div>
              <div className="flex items-center justify-between text-xs font-bold text-brand-indigo border-t border-brand-mitti/50 pt-2">
                <span>Expected Drawer Cash:</span>
                <span className="font-mono text-sm text-brand-indigo">{money(shiftStats.expectedCash)}</span>
              </div>

              <div>
                <Label className="text-xs font-bold text-brand-indigo flex items-center justify-between">
                  <span>Actual Counted Cash in Drawer</span>
                  <button 
                    type="button" 
                    onClick={() => setCountedCashInput(String(shiftStats.expectedCash))}
                    className="text-[10px] text-blue-600 hover:underline font-normal"
                  >
                    Match Expected
                  </button>
                </Label>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-2.5 text-sm font-bold text-brand-indigo/50">₹</span>
                  <Input
                    type="number"
                    min="0"
                    placeholder={String(shiftStats.expectedCash)}
                    value={countedCashInput}
                    onChange={(e) => setCountedCashInput(e.target.value)}
                    className="pl-7 rounded-xl border-brand-mitti font-bold text-base text-brand-indigo"
                  />
                </div>
              </div>

              {/* Variance Indicator */}
              <div className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-between ${
                shiftStats.variance === 0
                  ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                  : shiftStats.variance > 0
                    ? "bg-blue-50 border-blue-300 text-blue-800"
                    : "bg-rose-50 border-rose-300 text-rose-800"
              }`}>
                <span>Reconciliation:</span>
                <span>
                  {shiftStats.variance === 0 
                    ? "✓ Perfect Match (₹0)" 
                    : shiftStats.variance > 0 
                      ? `+₹${shiftStats.variance.toFixed(2)} Surplus (Extra)` 
                      : `-₹${Math.abs(shiftStats.variance).toFixed(2)} Shortage (Kam)`}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-2 mt-1">
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                onClick={handlePrintHandoverSlip}
                className="rounded-xl border-brand-mitti text-xs font-bold flex items-center justify-center gap-1.5 h-10 hover:border-brand-indigo"
              >
                <Printer className="w-3.5 h-3.5 text-slate-700" />
                <span>Print Thermal Slip</span>
              </Button>
              <Button
                variant="outline"
                onClick={handleShareShiftWhatsApp}
                className="rounded-xl border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center justify-center gap-1.5 h-10"
              >
                <Share2 className="w-3.5 h-3.5 text-emerald-700" />
                <span>WhatsApp Owner</span>
              </Button>
            </div>

            <Button
              onClick={handleFinalizeShift}
              className="w-full h-11 rounded-xl bg-brand-indigo hover:bg-brand-indigo/90 text-white font-bold text-sm shadow-md flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Close Shift & Lock Counter</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      {/* =========================================================
          MOBILE FLOATING CART PILL (lg:hidden)
      ========================================================= */}
      {cart.length > 0 && !mobileCartOpen && (
        <div className="lg:hidden fixed bottom-[76px] inset-x-3 z-40 bg-gradient-to-r from-brand-indigo via-[#261E7A] to-brand-indigo text-white p-3.5 rounded-2xl shadow-2xl border-2 border-white/20 flex items-center justify-between animate-in slide-in-from-bottom duration-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-terracotta text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
              {cart.reduce((a, c) => a + c.qty, 0)}
            </div>
            <div>
              <div className="text-sm font-extrabold leading-tight">{money(total)}</div>
              <div className="text-[11px] text-white/80 font-medium">{cart.length} item{cart.length > 1 ? "s" : ""} in bill</div>
            </div>
          </div>
          <button
            onClick={() => setMobileCartOpen(true)}
            className="bg-brand-terracotta hover:bg-brand-terracotta/90 text-white text-xs font-extrabold px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
          >
            <span>Review & Pay</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* =========================================================
          MOBILE SLIDE-UP BILL DRAWER (lg:hidden)
      ========================================================= */}
      {mobileCartOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-brand-indigo/60 backdrop-blur-xs animate-in fade-in"
            onClick={() => setMobileCartOpen(false)}
          />

          {/* Drawer Sheet */}
          <div className="relative w-full max-h-[88vh] bg-white rounded-t-3xl shadow-2xl border-t-2 border-brand-mitti flex flex-col z-10 animate-in slide-in-from-bottom duration-300">
            
            {/* Drawer Drag handle & Header */}
            <div className="p-4 border-b border-brand-mitti/80 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-brand-terracotta/10 text-brand-terracotta grid place-items-center">
                  <Receipt className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold text-brand-indigo">
                    Active Bill Slip
                  </h3>
                  <p className="text-[11px] text-brand-indigo/60">
                    {cart.reduce((acc, it) => acc + it.qty, 0)} item{cart.reduce((acc, it) => acc + it.qty, 0) !== 1 ? "s" : ""} in cart
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {cart.length > 0 && (
                  <button
                    onClick={clearCart}
                    className="text-xs text-red-600 hover:bg-red-50 px-2.5 py-1.5 rounded-lg border border-red-200 font-semibold flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Clear</span>
                  </button>
                )}
                <button
                  onClick={() => setMobileCartOpen(false)}
                  className="w-8 h-8 rounded-full bg-brand-sand hover:bg-brand-mitti grid place-items-center text-brand-indigo/70 hover:text-brand-indigo transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Scrollable Drawer Body */}
            <div className="p-4 overflow-y-auto space-y-4 flex-1">
              
              {/* Customer Khata Selector */}
              <div className="p-3 rounded-2xl bg-brand-sand/70 border border-brand-mitti">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-bold text-brand-indigo/70 uppercase tracking-wider">
                    Customer / Khata
                  </span>
                  <button
                    onClick={() => setNewCustomer({ ...newCustomer, open: true })}
                    className="text-xs font-bold text-brand-terracotta hover:underline flex items-center gap-1"
                  >
                    <UserPlus className="w-3 h-3" /> + Add
                  </button>
                </div>

                <Select value={customerId} onValueChange={setCustomerId}>
                  <SelectTrigger className="bg-white border-brand-mitti rounded-xl h-9 text-xs font-medium">
                    <SelectValue placeholder="Walk-in Customer" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Walk-in Customer</SelectItem>
                    {customers.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name} {c.phone && `· ${c.phone}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Items List */}
              <div className="space-y-2">
                {cart.length === 0 ? (
                  <div className="py-8 text-center text-brand-indigo/50 text-xs">
                    <ShoppingBag className="w-7 h-7 opacity-30 mx-auto mb-1.5" />
                    Cart is empty. Tap any product to add.
                  </div>
                ) : (
                  cart.map((item, idx) => (
                    <div 
                      key={item.product_id}
                      className="p-2.5 rounded-2xl bg-brand-sand/40 border border-brand-mitti/80 flex items-center justify-between gap-2.5"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-heading font-bold text-brand-indigo text-xs truncate">
                          {item.name}
                        </div>
                        <div className="text-[11px] text-brand-indigo/60 font-mono">
                          {money(item.price)} × {item.qty}
                        </div>
                      </div>

                      {/* Quantity Controls (Large 36px touch targets for mobile) */}
                      <div className="flex items-center gap-1 bg-white px-1.5 py-1 rounded-xl border border-brand-mitti">
                        <button 
                          onClick={() => updateQty(idx, -1)}
                          className="w-9 h-9 rounded-lg bg-brand-sand hover:bg-brand-mitti grid place-items-center text-brand-indigo font-bold active:scale-90 transition-all"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="font-mono font-bold text-sm w-5 text-center text-brand-indigo">
                          {item.qty}
                        </span>
                        <button 
                          onClick={() => updateQty(idx, 1)}
                          className="w-9 h-9 rounded-lg bg-brand-sand hover:bg-brand-mitti grid place-items-center text-brand-indigo font-bold active:scale-90 transition-all"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="font-heading font-extrabold text-xs text-brand-indigo min-w-[50px] text-right">
                        {money(item.price * item.qty)}
                      </div>

                      <button 
                        onClick={() => removeItem(idx)}
                        className="text-brand-indigo/30 hover:text-red-600 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Subtotal & Discount */}
              {cart.length > 0 && (
                <div className="pt-3 border-t border-brand-mitti space-y-2 text-xs">
                  <div className="flex justify-between text-brand-indigo/70 font-medium">
                    <span>Subtotal</span>
                    <span className="font-bold text-brand-indigo font-mono">{money(subtotal)}</span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className="text-brand-indigo/70 font-medium flex items-center gap-1">
                      <Tag className="w-3.5 h-3.5 text-brand-terracotta" />
                      Discount
                    </span>
                    <div className="flex items-center gap-1.5">
                      <Input
                        type="number"
                        min="0"
                        value={discount}
                        onChange={(e) => setDiscount(e.target.value)}
                        placeholder="0"
                        className="w-16 h-7 text-right rounded-lg border-brand-mitti text-xs"
                      />
                      <button
                        onClick={() => setDiscountType(prev => prev === "flat" ? "percent" : "flat")}
                        className="px-2 py-1 rounded-lg bg-brand-sand border border-brand-mitti font-bold text-[10px] text-brand-indigo"
                      >
                        {discountType === "flat" ? "₹" : "%"}
                      </button>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-brand-mitti flex items-baseline justify-between">
                    <span className="text-xs uppercase tracking-widest font-extrabold text-brand-terracotta">
                      Total Due
                    </span>
                    <span className="font-display font-extrabold text-2xl text-brand-indigo">
                      {money(total)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Drawer Bottom Checkout Action */}
            <div className="p-4 border-t border-brand-mitti bg-brand-sand/20">
              <Button
                disabled={cart.length === 0}
                onClick={() => {
                  setMobileCartOpen(false);
                  setMethod("cash");
                  setAmountReceived(String(total));
                  setPayOpen(true);
                }}
                className="w-full h-12 rounded-2xl bg-brand-terracotta hover:bg-brand-terracotta/90 text-white font-bold text-sm shadow-md active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <span>Proceed to Payment · {money(total)}</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>

          </div>
        </div>
      )}

      {/* Dukaan 3.0 Voice Billing Modal */}
      <VoiceBillingModal
        isOpen={voiceModalOpen}
        onClose={() => setVoiceModalOpen(false)}
        products={products}
        onAddItems={handleVoiceAddItems}
      />

      {/* Dukaan 3.0 Customer-Facing Secondary Display Modal */}
      <CustomerDisplayModal
        isOpen={customerDisplayOpen}
        onClose={() => setCustomerDisplayOpen(false)}
        cart={cart.map(c => ({ name: c.name, price: c.price, quantity: c.qty }))}
        totals={{ subtotal, discount: discountAmount, grandTotal: total }}
        storeName={shop?.name || activeShop?.name || "Dukaan Superstore"}
        upiId={shop?.upi_id || "merchant@upi"}
        isPaid={Boolean(completedBill)}
        onSendWhatsappSlip={(phone) => {
          setWaPhone(phone);
          handleSendWhatsAppBill({ ...completedBill, customer_phone: phone });
        }}
      />

      {/* Dukaan 3.0 Split Payment Modal */}
      <SplitPaymentModal
        isOpen={splitPaymentOpen}
        onClose={() => setSplitPaymentOpen(false)}
        grandTotal={total}
        customers={customers}
        selectedCustomer={selectedCustomerObj}
        onConfirmSplitPayment={handleSplitPaymentConfirm}
      />

    </div>
  );
}