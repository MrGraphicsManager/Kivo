import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, money } from "@/lib/api";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Pencil, 
  Trash2, 
  Plus, 
  Infinity as InfinityIcon, 
  Search, 
  Package, 
  TrendingUp, 
  Layers, 
  AlertTriangle,
  LayoutGrid,
  List,
  Sparkles,
  Tag,
  Boxes,
  CheckCircle2,
  DollarSign,
  Warehouse,
  Clock,
  ShieldAlert,
  ShieldCheck,
  Calendar,
  ArrowRight,
  Barcode,
  Zap,
  RefreshCw,
  Store,
  Lock
} from "lucide-react";
import { getStoredProducts, saveStoredProducts } from "@/lib/defaultProducts";
import { useAuth } from "@/lib/AuthContext";
import { FMCG_MASTER_CATALOG, findFMCGByBarcode, searchFMCGCatalog } from "@/lib/fmcgMasterCatalog";
import { isCashierModeActive, getProStaffSettings } from "@/lib/proStaffPermissions";
import OwnerPinDialog from "@/components/OwnerPinDialog";

export const getExpiryStatus = (expiryDate) => {
  if (!expiryDate) return { status: "none", label: "", daysLeft: null, color: "" };
  const exp = new Date(expiryDate);
  if (isNaN(exp.getTime())) return { status: "none", label: "", daysLeft: null, color: "" };
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expZero = new Date(exp);
  expZero.setHours(0, 0, 0, 0);
  
  const diffTime = expZero.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) {
    return { 
      status: "expired", 
      label: `Expired (${Math.abs(diffDays)}d ago)`, 
      daysLeft: diffDays, 
      color: "bg-rose-100 text-rose-800 border-rose-300",
      isCritical: true
    };
  } else if (diffDays <= 30) {
    return { 
      status: "expiring_soon", 
      label: diffDays === 0 ? "Expires Today" : `Exp in ${diffDays}d`, 
      daysLeft: diffDays, 
      color: "bg-amber-100 text-amber-800 border-amber-300",
      isWarning: true
    };
  } else {
    return { 
      status: "valid", 
      label: `Exp: ${expiryDate}`, 
      daysLeft: diffDays, 
      color: "bg-emerald-50 text-emerald-700 border-emerald-200",
      isValid: true
    };
  }
};

const EMPTY = { 
  name: "", 
  barcode: "",
  category: "Kirana & Grains", 
  selling_price: "", 
  purchase_price: "", 
  stock: 10, 
  min_stock: 5, 
  unlimited_stock: false,
  batch_number: "",
  expiry_date: ""
};

const DEFAULT_CATEGORIES = [
  "Kirana & Grains",
  "Medicines & Tablets",
  "Syrups & Liquids",
  "Ointments & First Aid",
  "Health Supplements",
  "Edible Oil & Ghee",
  "Dairy & Eggs",
  "Biscuits & Snacks",
  "Spices & Masala",
  "Beverages & Tea",
  "Personal Care",
  "Household & Soaps",
  "General"
];

export default function Products() {
  const navigate = useNavigate();
  const { user, shops, currentShopId } = useAuth();
  const activeShop = (shops || []).find(s => s?.id === currentShopId) || shops?.[0];
  const shopCategory = (activeShop?.store_category || "").toLowerCase();
  
  // STRICT GATING: Feature #45 activates ONLY if user is Premium AND shop is Medical Store
  const isMedicalStore = shopCategory.includes("medical") || shopCategory.includes("pharmacy");
  const isPremium = user?.subscription?.plan === "premium" || user?.is_premium || user?.is_admin || user?.plan === "premium";
  const canUseExpiryGuard = isPremium && isMedicalStore;

  const [items, setItems] = useState(() => getStoredProducts());
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all"); // "all", "in_stock", "low_stock", "out_of_stock", "expiring_soon", "expired"
  const [viewMode, setViewMode] = useState("grid"); // "grid" or "table"
  const [form, setForm] = useState({ open: false, mode: "create", data: EMPTY });
  const [busy, setBusy] = useState(false);

  // Cashier Mode & Owner Security PIN state
  const [isCashierMode, setIsCashierMode] = useState(() => isCashierModeActive());
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [pendingDeleteProduct, setPendingDeleteProduct] = useState(null);

  const staffSettings = useMemo(() => {
    return getProStaffSettings(currentShopId, activeShop);
  }, [currentShopId, activeShop]);

  const isHideCostActive = isCashierMode && staffSettings?.hide_purchase_price;

  useEffect(() => {
    const handleCashierChange = () => setIsCashierMode(isCashierModeActive());
    window.addEventListener("dukaan_cashier_mode_changed", handleCashierChange);
    window.addEventListener("dukaan_shift_ended", handleCashierChange);
    return () => {
      window.removeEventListener("dukaan_cashier_mode_changed", handleCashierChange);
      window.removeEventListener("dukaan_shift_ended", handleCashierChange);
    };
  }, []);

  // Feature 18 & Feature 35 states
  const [fmcgModalOpen, setFmcgModalOpen] = useState(false);
  const [fmcgSearch, setFmcgSearch] = useState("");
  const [syncingBranches, setSyncingBranches] = useState(false);

  const handleBarcodeLookup = (code) => {
    if (!code) return;
    const found = findFMCGByBarcode(code);
    if (found) {
      setForm(prev => ({
        ...prev,
        data: {
          ...prev.data,
          barcode: found.barcode,
          name: prev.data.name || found.name,
          category: found.category || prev.data.category,
          selling_price: prev.data.selling_price || found.selling_price,
          purchase_price: prev.data.purchase_price || Math.round(found.selling_price * 0.82)
        }
      }));
      toast.success(`⚡ Matched FMCG: ${found.name} (MRP ₹${found.mrp})`);
    }
  };

  const handleSyncToAllBranches = async () => {
    if (!shops || shops.length <= 1) {
      toast.error("You currently only have 1 active branch.");
      return;
    }
    if (!window.confirm(`Sync ${items.length} products and prices to all ${shops.length - 1} other branch locations? This will ensure catalog parity across all your stores.`)) {
      return;
    }
    setSyncingBranches(true);
    try {
      shops.forEach(sh => {
        if (sh.id !== currentShopId) {
          localStorage.setItem(`dukaan_products_${sh.id}`, JSON.stringify(items));
        }
      });
      toast.success(`✅ Successfully synced ${items.length} products across ${shops.length} branch stores!`);
    } catch {
      toast.error("Failed to synchronize branch inventories");
    } finally {
      setSyncingBranches(false);
    }
  };

  const handleImportFMCG = (fmcgItem) => {
    if (items.some(i => i.barcode === fmcgItem.barcode || i.name.toLowerCase() === fmcgItem.name.toLowerCase())) {
      toast.info(`"${fmcgItem.name}" is already in your inventory.`);
      return;
    }
    const newProd = {
      id: `prod_fmcg_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      name: fmcgItem.name,
      barcode: fmcgItem.barcode,
      category: fmcgItem.category,
      selling_price: fmcgItem.selling_price,
      purchase_price: Math.round(fmcgItem.selling_price * 0.85),
      stock: 24,
      min_stock: 5,
      unlimited_stock: false,
      hsn: fmcgItem.hsn,
      gst_rate: fmcgItem.gst_rate
    };
    const currentStored = getStoredProducts();
    const updated = [newProd, ...currentStored];
    saveStoredProducts(updated);
    setItems(updated);
    toast.success(`⚡ Added "${fmcgItem.name}" to inventory!`);
    api.post("/products", newProd).catch(() => {});
  };

  const load = () => {
    api.get("/products", { params: { q: q || undefined, category } })
      .then(r => setItems(Array.isArray(r.data) ? r.data : []))
      .catch(() => setItems([]));
  };

  useEffect(() => {
    load();
    /* eslint-disable-next-line */
  }, [q, category]);

  useEffect(() => {
  }, []);

  const allCategories = useMemo(() => {
    const set = new Set(DEFAULT_CATEGORIES);
    items.forEach(p => { if (p.category) set.add(p.category.trim()); });
    return ["all", ...Array.from(set)];
  }, [items]);

  // Inventory value & stats
  const totalStockValue = useMemo(() => {
    return items.reduce((acc, it) => acc + (it.unlimited_stock ? 0 : (it.selling_price || 0) * (it.stock || 0)), 0);
  }, [items]);

  const lowStockCount = useMemo(() => {
    return items.filter(p => !p.unlimited_stock && p.stock <= (p.min_stock || 5)).length;
  }, [items]);

  const expiredCount = useMemo(() => {
    return items.filter(p => p.expiry_date && getExpiryStatus(p.expiry_date).status === "expired").length;
  }, [items]);

  const expiringSoonCount = useMemo(() => {
    return items.filter(p => p.expiry_date && getExpiryStatus(p.expiry_date).status === "expiring_soon").length;
  }, [items]);

  // Filtered by search, category, and stock/expiry status
  const filtered = useMemo(() => {
    return items.filter(p => {
      // Expiry filter (Feature #45)
      if (statusFilter === "expired") {
        if (!p.expiry_date) return false;
        return getExpiryStatus(p.expiry_date).status === "expired";
      }
      if (statusFilter === "expiring_soon") {
        if (!p.expiry_date) return false;
        return getExpiryStatus(p.expiry_date).status === "expiring_soon";
      }

      // Stock status filter
      if (statusFilter === "in_stock" && (p.stock <= (p.min_stock || 0) && !p.unlimited_stock)) return false;
      if (statusFilter === "low_stock" && (p.unlimited_stock || p.stock <= 0 || p.stock > (p.min_stock || 5))) return false;
      if (statusFilter === "out_of_stock" && (p.unlimited_stock || p.stock > 0)) return false;
      return true;
    });
  }, [items, statusFilter]);

  const submit = () => {
    const data = {
      ...form.data,
      selling_price: Number(form.data.selling_price || 0),
      purchase_price: Number(form.data.purchase_price || 0),
      stock: form.data.unlimited_stock ? 0 : Number(form.data.stock || 0),
      min_stock: form.data.unlimited_stock ? 0 : Number(form.data.min_stock || 5),
      unlimited_stock: !!form.data.unlimited_stock,
      batch_number: form.data.batch_number ? String(form.data.batch_number).trim() : "",
      expiry_date: form.data.expiry_date ? String(form.data.expiry_date).trim() : ""
    };
    if (!data.name.trim()) return toast.error("Product name is required");
    if (data.selling_price <= 0) return toast.error("Please enter a valid selling price");

    // ⚡ 0.001s Instant Local Save
    if (form.mode === "create") {
      data.id = data.id || `prod_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
      const currentStored = getStoredProducts();
      const updated = [data, ...currentStored.filter(p => p.id !== data.id)];
      saveStoredProducts(updated);
      setItems(updated);
      setForm({ open: false, mode: "create", data: EMPTY });
      toast.success(`⚡ Product "${data.name}" added to inventory!`);

      // Fire-and-forget server sync in background
      api.post("/products", data).then(res => {
        if (res?.data?.id && res.data.id !== data.id) {
          const prods = getStoredProducts();
          const idx = prods.findIndex(p => p.id === data.id);
          if (idx !== -1) {
            prods[idx].id = res.data.id;
            saveStoredProducts(prods);
            setItems([...prods]);
          }
        }
      }).catch(() => {});
    } else {
      const currentStored = getStoredProducts();
      const updated = currentStored.map(p => (p.id === form.data.id ? { ...p, ...data } : p));
      saveStoredProducts(updated);
      setItems(updated);
      setForm({ open: false, mode: "create", data: EMPTY });
      toast.success(`⚡ Product "${data.name}" updated!`);

      api.put(`/products/${form.data.id}`, data).catch(() => {});
    }
  };

  const performDeleteProduct = (p) => {
    const currentStored = getStoredProducts();
    const updated = currentStored.filter(item => item.id !== p.id);
    saveStoredProducts(updated);
    setItems(updated);
    toast.success(`Deleted ${p.name}`);
    api.delete(`/products/${p.id}`).catch(() => {});
  };

  const del = async (p) => {
    if (isCashierMode && staffSettings?.block_product_deletion) {
      setPendingDeleteProduct(p);
      setPinModalOpen(true);
      return;
    }

    if (!confirm(`Are you sure you want to delete ${p.name}?`)) return;
    performDeleteProduct(p);
  };

  // Live profit margin calculation for modal form
  const selling = Number(form.data.selling_price || 0);
  const purchase = Number(form.data.purchase_price || 0);
  const profitMargin = selling > 0 && purchase > 0 ? Math.round(((selling - purchase) / selling) * 100) : 0;

  return (
    <div className="space-y-6 animate-fade-up max-w-[1400px] mx-auto pb-16 font-sans selection:bg-brand-terracotta/20">
      
      {/* =========================================================
          HERO BANNER
      ========================================================= */}
      <div className="bg-gradient-to-r from-brand-indigo via-[#261E7A] to-brand-indigo text-white p-7 md:p-8 rounded-3xl shadow-lg border-2 border-brand-indigo/40 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-brand-terracotta/20 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-brand-terracotta flex items-center justify-center shrink-0 shadow-md">
            <Package className="w-7 h-7 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs uppercase tracking-widest text-white/60 font-semibold font-mono">PRODUCT CATALOG</span>
              <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-xs font-bold text-emerald-300">
                {items.length} SKUs Active
              </span>
            </div>
            <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight text-white">
              Products & Pricing
            </h1>
          </div>
        </div>

        {/* Stats & Add Button */}
        <div className="relative z-10 flex flex-wrap items-center gap-3">
          <div className="bg-white/10 border border-white/15 px-4 py-2 rounded-2xl backdrop-blur-md">
            <div className="text-[10px] uppercase font-bold text-white/60">Total Stock Value</div>
            <div className="font-display text-xl font-bold text-white">{money(totalStockValue)}</div>
          </div>
          <div className="bg-white/10 border border-white/15 px-4 py-2 rounded-2xl backdrop-blur-md">
            <div className="text-[10px] uppercase font-bold text-amber-300">Low Stock</div>
            <div className="font-display text-xl font-bold text-amber-300">{lowStockCount} items</div>
          </div>
          {canUseExpiryGuard && (
            <>
              <div className="bg-white/10 border border-white/15 px-4 py-2 rounded-2xl backdrop-blur-md">
                <div className="text-[10px] uppercase font-bold text-amber-300">Expiring Soon</div>
                <div className="font-display text-xl font-bold text-amber-300">{expiringSoonCount} items</div>
              </div>
              {expiredCount > 0 && (
                <div className="bg-rose-500/30 border border-rose-400/40 px-4 py-2 rounded-2xl backdrop-blur-md animate-pulse">
                  <div className="text-[10px] uppercase font-bold text-rose-200">Expired Items</div>
                  <div className="font-display text-xl font-bold text-rose-100">{expiredCount} items</div>
                </div>
              )}
            </>
          )}
          {shops && shops.length > 1 && (
            <Button
              variant="outline"
              onClick={handleSyncToAllBranches}
              disabled={syncingBranches}
              className="h-12 px-4 rounded-2xl bg-amber-500/20 hover:bg-amber-500/30 border-amber-400/40 text-amber-200 font-bold text-xs backdrop-blur-md flex items-center gap-1.5"
              title="Sync catalog & prices to all branch stores"
            >
              <RefreshCw className={`w-4 h-4 ${syncingBranches ? "animate-spin" : ""}`} />
              Sync All Branches ({shops.length})
            </Button>
          )}

          <Button
            variant="outline"
            onClick={() => setFmcgModalOpen(true)}
            className="h-12 px-4 rounded-2xl bg-white/10 hover:bg-white/20 border-white/20 text-white font-bold text-xs backdrop-blur-md flex items-center gap-1.5"
          >
            <Zap className="w-4 h-4 text-amber-400" /> FMCG Master Catalog
          </Button>

          <Button
            variant="outline"
            onClick={() => navigate("/app/stock")}
            className="h-12 px-4 rounded-2xl bg-white/10 hover:bg-white/20 border-white/20 text-white font-bold text-xs backdrop-blur-md flex items-center gap-1.5"
          >
            <Warehouse className="w-4 h-4" /> Stock Control
          </Button>
          <Button 
            onClick={() => setForm({ open: true, mode: "create", data: EMPTY })} 
            data-testid="add-product-btn" 
            className="h-12 px-5 rounded-2xl bg-brand-terracotta hover:bg-brand-terracotta/90 text-white font-bold text-xs shadow-glow active:scale-95 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add Product
          </Button>
        </div>
      </div>

      {/* Feature #45 Teaser Banner (Medical Store on Non-Premium Plan) */}
      {isMedicalStore && !isPremium && (
        <div className="bg-gradient-to-r from-amber-500/15 via-amber-50 to-amber-500/15 border-2 border-amber-400/50 rounded-3xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm animate-fade-up">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-900 flex items-center justify-center shrink-0 border border-amber-400/40">
              <ShieldAlert className="w-5 h-5 text-amber-800" />
            </div>
            <div>
              <div className="font-heading font-bold text-sm text-amber-950 flex items-center gap-2">
                <span>Medical & Pharmacy Store Detected</span>
                <span className="text-[10px] font-mono uppercase bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full font-bold">Feature #45</span>
              </div>
              <p className="text-xs text-amber-900/80 mt-0.5 max-w-2xl">
                Batch number tracking and automated Medicine Expiry Alert Guard are exclusive to Dukaan Premium. Upgrade your plan to protect patients, receive shelf countdown warnings, and block expired sales at checkout.
              </p>
            </div>
          </div>
          <Button
            onClick={() => navigate("/subscribe")}
            className="rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs h-10 px-4 shrink-0 shadow-xs flex items-center gap-1.5"
          >
            <span>Upgrade to Premium</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      )}

      {/* =========================================================
          CONTROLS BAR: SEARCH, FILTERS & VIEW TOGGLE
      ========================================================= */}
      <div className="bg-white p-3.5 sm:p-4 rounded-3xl border-2 border-brand-mitti shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
        
        {/* Left: Search & Category */}
        <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-brand-indigo/40" />
            <Input 
              data-testid="product-search" 
              placeholder="Search by product name or category…" 
              value={q} 
              onChange={(e) => setQ(e.target.value)} 
              className="pl-11 pr-4 h-11 rounded-2xl border-brand-mitti bg-brand-sand/50 text-sm font-medium text-brand-indigo w-full" 
            />
          </div>

          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-full sm:w-44 h-11 rounded-2xl border-brand-mitti bg-brand-sand/50 text-xs font-bold text-brand-indigo shrink-0">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {allCategories.map(c => (
                <SelectItem key={c} value={c}>
                  {c === "all" ? "All Categories" : c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Right: Stock Status Pills & View Mode */}
        <div className="flex items-center justify-between sm:justify-start gap-2 max-w-full">
          <div className="flex items-center bg-brand-sand p-1 rounded-2xl border border-brand-mitti overflow-x-auto whitespace-nowrap scrollbar-none gap-1 flex-1 sm:flex-initial">
            {[
              { id: "all", label: "All" },
              { id: "in_stock", label: "In Stock" },
              { id: "low_stock", label: `Low (${lowStockCount})` },
              { id: "out_of_stock", label: "Out of Stock" },
              ...(canUseExpiryGuard ? [
                { id: "expiring_soon", label: `Expiring (${expiringSoonCount})` },
                { id: "expired", label: `Expired (${expiredCount})` }
              ] : [])
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                  statusFilter === tab.id 
                    ? tab.id === "expired"
                      ? "bg-rose-600 text-white shadow-xs"
                      : tab.id === "expiring_soon"
                        ? "bg-amber-500 text-slate-900 shadow-xs"
                        : "bg-white text-brand-indigo shadow-xs" 
                    : tab.id === "expired" && expiredCount > 0
                      ? "text-rose-600 font-bold hover:bg-rose-100"
                      : tab.id === "expiring_soon" && expiringSoonCount > 0
                        ? "text-amber-700 font-bold hover:bg-amber-100"
                        : "text-brand-indigo/60 hover:text-brand-indigo"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* View Toggle */}
          <div className="flex items-center bg-brand-sand p-1 rounded-2xl border border-brand-mitti shrink-0">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-xl ${viewMode === "grid" ? "bg-white text-brand-indigo shadow-xs" : "text-brand-indigo/40"}`}
              title="Card Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-xl ${viewMode === "table" ? "bg-white text-brand-indigo shadow-xs" : "text-brand-indigo/40"}`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>

      {/* =========================================================
          PRODUCT DISPLAY: GRID VIEW OR TABLE VIEW
      ========================================================= */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border-2 border-dashed border-brand-mitti p-8">
          <Boxes className="w-12 h-12 text-brand-indigo/30 mx-auto mb-3" />
          <h3 className="font-heading font-bold text-lg text-brand-indigo">No products found</h3>
          <p className="text-xs text-brand-indigo/60 mt-1">Try adjusting your search query or category filter.</p>
          <Button 
            onClick={() => setForm({ open: true, mode: "create", data: EMPTY })} 
            className="mt-4 rounded-full bg-brand-terracotta text-white text-xs font-bold"
          >
            + Add New Product
          </Button>
        </div>
      ) : viewMode === "grid" ? (
        /* GRID CARD VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5" data-testid="products-grid">
          {filtered.map(p => {
            const isLow = !p.unlimited_stock && p.stock > 0 && p.stock <= (p.min_stock || 5);
            const isOut = !p.unlimited_stock && p.stock <= 0;
            const margin = p.selling_price && p.purchase_price 
              ? Math.round(((p.selling_price - p.purchase_price) / p.selling_price) * 100) 
              : null;

            return (
              <div 
                key={p.id}
                className="bg-white rounded-3xl border-2 border-brand-mitti p-5 shadow-xs hover:border-brand-indigo/30 hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-brand-indigo/60 bg-brand-sand px-2.5 py-1 rounded-full border border-brand-mitti">
                      {p.category || "General"}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      p.unlimited_stock ? "bg-brand-indigo/10 text-brand-indigo" :
                      isOut ? "bg-red-100 text-red-700" :
                      isLow ? "bg-amber-100 text-amber-800" : "bg-emerald-50 text-emerald-700"
                    }`}>
                      {p.unlimited_stock ? "Unlimited" : isOut ? "Out of stock" : `${p.stock} in stock`}
                    </span>
                  </div>

                  <div className="my-2">
                    <h3 className="font-heading font-bold text-base text-brand-indigo dark:text-white leading-snug line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {p.name}
                    </h3>
                    {p.barcode && (
                      <div className="text-[11px] font-mono text-slate-400 dark:text-slate-500 mt-1 truncate">
                        Barcode: #{p.barcode}
                      </div>
                    )}
                  </div>

                  {/* Feature #45: Medicine Expiry & Batch Badges for Medical Stores */}
                  {canUseExpiryGuard && (p.expiry_date || p.batch_number) && (
                    <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
                      {p.expiry_date && (() => {
                        const expInfo = getExpiryStatus(p.expiry_date);
                        return (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${expInfo.color}`}>
                            {expInfo.status === "expired" && <AlertTriangle className="w-3 h-3 text-rose-600" />}
                            {expInfo.status === "expiring_soon" && <Clock className="w-3 h-3 text-amber-700" />}
                            {expInfo.status === "valid" && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                            <span>{expInfo.label}</span>
                          </span>
                        );
                      })()}
                      {p.batch_number && (
                        <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          Lot: {p.batch_number}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Pricing breakdown */}
                  <div className="mt-4 p-3 rounded-2xl bg-brand-sand/50 border border-brand-mitti/60 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-brand-indigo/50 uppercase font-bold">Selling Price</div>
                      <div className="font-display font-bold text-xl text-brand-indigo">
                        {money(p.selling_price)}
                      </div>
                    </div>
                    {p.purchase_price > 0 && (
                      <div className="text-right">
                        <div className="text-[10px] text-brand-indigo/50 uppercase font-bold">Cost / Margin</div>
                        {isHideCostActive ? (
                          <div className="text-[11px] font-semibold text-brand-indigo/40 flex items-center justify-end gap-1" title="Protected (Owner Only)">
                            <Lock className="w-3 h-3 text-amber-600" />
                            <span>Cost Hidden</span>
                          </div>
                        ) : (
                          <div className="text-xs font-semibold text-emerald-700 flex items-center justify-end gap-1">
                            <span>{money(p.purchase_price)}</span>
                            {margin !== null && (
                              <span className="bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded text-[10px] font-bold">
                                +{margin}%
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-5 pt-3 border-t border-brand-mitti/60 flex items-center justify-between">
                  <span className="text-[11px] text-brand-indigo/50 font-medium">
                    Min Threshold: {p.unlimited_stock ? "—" : p.min_stock || 5}
                  </span>
                  
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setForm({ open: true, mode: "edit", data: p })}
                      className="p-2 rounded-xl bg-brand-sand hover:bg-brand-mitti text-brand-indigo transition-colors"
                      title="Edit Product"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => del(p)}
                      className="p-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 transition-colors"
                      title="Delete Product"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="overflow-x-auto rounded-3xl border-2 border-brand-mitti bg-white shadow-xs">
          <table className="w-full text-sm font-sans text-brand-indigo">
            <thead className="bg-brand-sand border-b-2 border-brand-mitti text-left text-[11px] uppercase tracking-wider font-bold text-brand-terracotta">
              <tr>
                <th className="px-6 py-4">Product Name</th>
                <th className="px-6 py-4">Category</th>
                {canUseExpiryGuard && <th className="px-6 py-4">Batch & Expiry</th>}
                <th className="px-6 py-4 text-right">Selling Price</th>
                <th className="px-6 py-4 text-right">Purchase Price</th>
                <th className="px-6 py-4 text-right">Stock</th>
                <th className="px-6 py-4 text-right">Min Level</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-mitti" data-testid="products-table">
              {filtered.map(p => {
                const isLow = !p.unlimited_stock && p.stock > 0 && p.stock <= (p.min_stock || 5);
                const isOut = !p.unlimited_stock && p.stock <= 0;
                return (
                  <tr key={p.id} className="hover:bg-brand-sand/50 transition-colors">
                    <td className="px-6 py-4 font-heading font-bold text-base">{p.name}</td>
                    <td className="px-6 py-4 text-xs font-semibold uppercase text-brand-indigo/60">{p.category}</td>
                    {canUseExpiryGuard && (
                      <td className="px-6 py-4">
                        {p.expiry_date ? (() => {
                          const expInfo = getExpiryStatus(p.expiry_date);
                          return (
                            <div className="space-y-1">
                              <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${expInfo.color}`}>
                                {expInfo.status === "expired" ? <AlertTriangle className="w-3 h-3 text-rose-600" /> : expInfo.status === "expiring_soon" ? <Clock className="w-3 h-3 text-amber-700" /> : null}
                                {expInfo.label}
                              </span>
                              {p.batch_number && (
                                <div className="text-[10px] font-mono font-bold text-slate-500">
                                  Lot: {p.batch_number}
                                </div>
                              )}
                            </div>
                          );
                        })() : (
                          <span className="text-xs text-slate-400 font-mono">—</span>
                        )}
                      </td>
                    )}
                    <td className="px-6 py-4 text-right font-display font-bold text-base">{money(p.selling_price)}</td>
                    <td className="px-6 py-4 text-right text-xs font-mono text-brand-indigo/60">
                      {isHideCostActive ? (
                        <span className="text-slate-400 font-sans font-medium flex items-center justify-end gap-1" title="Protected (Owner Only)">
                          <Lock className="w-3 h-3 text-amber-600 inline" /> Hidden
                        </span>
                      ) : (
                        p.purchase_price ? money(p.purchase_price) : "—"
                      )}
                    </td>
                    <td className="px-6 py-4 text-right font-display font-bold text-base">
                      {p.unlimited_stock ? <InfinityIcon className="w-4 h-4 inline text-brand-indigo/40" /> : p.stock}
                    </td>
                    <td className="px-6 py-4 text-right text-xs text-brand-indigo/50">{p.unlimited_stock ? "—" : p.min_stock}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                        p.unlimited_stock ? "bg-brand-indigo/10 text-brand-indigo" :
                        isOut ? "bg-red-100 text-red-700" :
                        isLow ? "bg-amber-100 text-amber-800" : "bg-emerald-50 text-emerald-700"
                      }`}>
                        {p.unlimited_stock ? "Unlimited" : isOut ? "Out of Stock" : isLow ? "Low Stock" : "In Stock"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button 
                          onClick={() => setForm({ open: true, mode: "edit", data: p })}
                          className="p-2 rounded-lg bg-brand-sand hover:bg-brand-mitti text-brand-indigo"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => del(p)}
                          className="p-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* =========================================================
          ADD / EDIT PRODUCT MODAL
      ========================================================= */}
      <Dialog open={form.open} onOpenChange={(o) => setForm({ ...form, open: o })}>
        <DialogContent className="max-w-lg rounded-3xl p-7 border-2 border-brand-mitti">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl text-brand-indigo flex items-center gap-2">
              <Package className="w-5 h-5 text-brand-terracotta" />
              <span>{form.mode === "create" ? "Add New Product" : "Edit Product"}</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2 text-sm">
            {/* Name */}
            <div>
              <Label className="text-xs font-bold text-brand-indigo/70 uppercase">Product Name *</Label>
              <Input
                value={form.data.name}
                onChange={(e) => setForm({ ...form, data: { ...form.data, name: e.target.value } })}
                placeholder="e.g. Aashirvaad Shudh Atta 5kg"
                className="mt-1 h-11 rounded-xl border-brand-mitti text-base font-semibold"
              />
            </div>

            {/* Barcode / FMCG Lookup */}
            <div>
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold text-brand-indigo/70 uppercase flex items-center gap-1.5">
                  <Barcode className="w-3.5 h-3.5 text-brand-indigo" /> Barcode (EAN / UPC)
                </Label>
                <span className="text-[10px] text-brand-terracotta font-semibold">Auto-matches 55+ Indian FMCG brands</span>
              </div>
              <div className="mt-1 flex items-center gap-2">
                <Input
                  value={form.data.barcode || ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    setForm(prev => ({ ...prev, data: { ...prev.data, barcode: val } }));
                    handleBarcodeLookup(val);
                  }}
                  placeholder="Scan or enter barcode (e.g. 8901058852394 for Maggi)"
                  className="h-11 rounded-xl border-brand-mitti font-mono text-sm"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleBarcodeLookup(form.data.barcode)}
                  className="h-11 px-3 border-brand-mitti bg-brand-sand hover:bg-brand-mitti text-xs font-bold shrink-0"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-500 mr-1" /> Match
                </Button>
              </div>
            </div>

            {/* Category */}
            <div>
              <Label className="text-xs font-bold text-brand-indigo/70 uppercase">Category</Label>
              <Select 
                value={form.data.category} 
                onValueChange={(cat) => setForm({ ...form, data: { ...form.data, category: cat } })}
              >
                <SelectTrigger className="mt-1 h-11 rounded-xl border-brand-mitti">
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent>
                  {DEFAULT_CATEGORIES.map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Pricing Rows */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-bold text-brand-indigo/70 uppercase">Selling Price (₹) *</Label>
                <Input
                  type="number"
                  min="0"
                  value={form.data.selling_price}
                  onChange={(e) => setForm({ ...form, data: { ...form.data, selling_price: e.target.value } })}
                  placeholder="240"
                  className="mt-1 h-11 rounded-xl border-brand-mitti text-base font-bold font-mono"
                />
              </div>

              <div>
                <Label className="text-xs font-bold text-brand-indigo/70 uppercase">Purchase Cost (₹)</Label>
                {isHideCostActive ? (
                  <div className="mt-1 h-11 px-3.5 rounded-xl border border-dashed border-brand-mitti bg-slate-50 text-xs text-brand-indigo/50 flex items-center gap-2 font-medium">
                    <Lock className="w-3.5 h-3.5 text-amber-600" />
                    <span>Cost Hidden (Owner Protected)</span>
                  </div>
                ) : (
                  <Input
                    type="number"
                    min="0"
                    value={form.data.purchase_price}
                    onChange={(e) => setForm({ ...form, data: { ...form.data, purchase_price: e.target.value } })}
                    placeholder="190"
                    className="mt-1 h-11 rounded-xl border-brand-mitti text-base font-mono"
                  />
                )}
              </div>
            </div>

            {/* Profit Margin Preview Bar */}
            {profitMargin > 0 && !isHideCostActive && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs font-bold text-emerald-800">
                <span>Estimated Profit Margin:</span>
                <span className="font-heading text-sm text-emerald-700">+{profitMargin}% per item</span>
              </div>
            )}

            {/* Stock Settings */}
            <div className="pt-2 border-t border-brand-mitti space-y-3">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="unlimited-stock"
                  checked={form.data.unlimited_stock}
                  onCheckedChange={(checked) => setForm({ ...form, data: { ...form.data, unlimited_stock: !!checked } })}
                />
                <Label htmlFor="unlimited-stock" className="text-xs font-bold text-brand-indigo cursor-pointer">
                  Unlimited / Prepared Stock (Chai, samosas, fresh snacks)
                </Label>
              </div>

              {!form.data.unlimited_stock && (
                <div className="grid grid-cols-2 gap-4 pt-1">
                  <div>
                    <Label className="text-xs font-bold text-brand-indigo/70 uppercase">Initial Stock Count</Label>
                    <Input
                      type="number"
                      min="0"
                      value={form.data.stock}
                      onChange={(e) => setForm({ ...form, data: { ...form.data, stock: e.target.value } })}
                      className="mt-1 h-11 rounded-xl border-brand-mitti font-mono"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-bold text-brand-indigo/70 uppercase">Low Stock Alert Level</Label>
                    <Input
                      type="number"
                      min="1"
                      value={form.data.min_stock}
                      onChange={(e) => setForm({ ...form, data: { ...form.data, min_stock: e.target.value } })}
                      className="mt-1 h-11 rounded-xl border-brand-mitti font-mono"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Feature #45: Medicine & Pharmacy Batch + Expiry Guard */}
            {canUseExpiryGuard && (
              <div className="pt-3 border-t border-brand-mitti space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span className="font-heading font-bold text-xs uppercase text-brand-indigo tracking-wider">
                      Medicine Batch & Expiry Guard (Feature #45)
                    </span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    Premium Active
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs font-bold text-brand-indigo/70 uppercase">Batch / Lot Number</Label>
                    <Input
                      value={form.data.batch_number || ""}
                      onChange={(e) => setForm({ ...form, data: { ...form.data, batch_number: e.target.value.toUpperCase() } })}
                      placeholder="e.g. BATCH-2026-X8"
                      className="mt-1 h-11 rounded-xl border-brand-mitti font-mono text-sm uppercase font-bold"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-bold text-brand-indigo/70 uppercase">Expiry Date</Label>
                    <Input
                      type="date"
                      value={form.data.expiry_date || ""}
                      onChange={(e) => setForm({ ...form, data: { ...form.data, expiry_date: e.target.value } })}
                      className="mt-1 h-11 rounded-xl border-brand-mitti font-mono text-sm"
                    />
                  </div>
                </div>

                {form.data.expiry_date && (() => {
                  const status = getExpiryStatus(form.data.expiry_date);
                  if (status.status === "expired") {
                    return (
                      <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-800 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                        <span>Warning: This expiry date is in the past! Medicine will be flagged at checkout.</span>
                      </div>
                    );
                  } else if (status.status === "expiring_soon") {
                    return (
                      <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs font-bold text-amber-800 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>Near Expiry: This medicine expires in {status.daysLeft} days. Shelf watch will notify you.</span>
                      </div>
                    );
                  } else {
                    return (
                      <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Safe Medicine: Valid for {status.daysLeft} days.</span>
                      </div>
                    );
                  }
                })()}
              </div>
            )}
          </div>

          <DialogFooter className="mt-5 gap-2">
            <Button 
              variant="ghost" 
              onClick={() => setForm({ open: false, mode: "create", data: EMPTY })}
              className="rounded-full text-brand-indigo/70"
            >
              Cancel
            </Button>
            <Button 
              disabled={busy} 
              onClick={submit} 
              className="rounded-full bg-brand-terracotta hover:bg-brand-terracotta/90 text-white font-bold h-11 px-6 shadow-md"
            >
              {busy ? "Saving…" : form.mode === "create" ? "Add to Catalog" : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* =========================================================
          FMCG MASTER CATALOG IMPORT MODAL (Feature #18)
      ========================================================= */}
      <Dialog open={fmcgModalOpen} onOpenChange={setFmcgModalOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col rounded-3xl p-6 border-2 border-brand-mitti">
          <DialogHeader>
            <DialogTitle className="font-display text-xl text-brand-indigo flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500" />
              <span>Universal FMCG Master Barcode Catalog</span>
            </DialogTitle>
            <p className="text-xs text-brand-indigo/70">
              Browse 55+ authentic Indian retail products with verified EAN barcodes, HSN codes, and standard MRPs. Add to your store in 1 click!
            </p>
          </DialogHeader>

          {/* Search bar */}
          <div className="relative my-2">
            <Search className="w-4 h-4 absolute left-3 top-3.5 text-slate-400" />
            <Input
              value={fmcgSearch}
              onChange={(e) => setFmcgSearch(e.target.value)}
              placeholder="Search FMCG products (e.g. Maggi, Parle-G, Amul, Dettol, Tata Salt)..."
              className="pl-9 h-11 rounded-xl border-brand-mitti text-sm"
            />
          </div>

          {/* Items list */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 my-2 max-h-[50vh]">
            {searchFMCGCatalog(fmcgSearch, 50).map(item => {
              const alreadyAdded = items.some(i => i.barcode === item.barcode || i.name.toLowerCase() === item.name.toLowerCase());
              return (
                <div 
                  key={item.barcode}
                  className="flex items-center justify-between p-3 rounded-2xl bg-brand-sand/50 border border-brand-mitti hover:bg-brand-sand transition-all"
                >
                  <div className="space-y-0.5">
                    <div className="font-bold text-sm text-brand-indigo">{item.name}</div>
                    <div className="flex items-center gap-2 text-[11px] text-brand-indigo/60 font-mono">
                      <span>Barcode: {item.barcode}</span>
                      <span>·</span>
                      <span>{item.category}</span>
                      <span>·</span>
                      <span>HSN: {item.hsn}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <div className="font-bold text-sm text-brand-terracotta">₹{item.selling_price}</div>
                      <div className="text-[10px] text-slate-400 font-mono">MRP ₹{item.mrp}</div>
                    </div>
                    <Button
                      size="sm"
                      disabled={alreadyAdded}
                      onClick={() => handleImportFMCG(item)}
                      className={`h-8 px-3 text-xs font-bold rounded-xl ${
                        alreadyAdded 
                          ? "bg-slate-200 text-slate-500 cursor-not-allowed" 
                          : "bg-brand-indigo hover:bg-brand-indigo/90 text-white shadow-xs"
                      }`}
                    >
                      {alreadyAdded ? "In Stock" : "+ Add"}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          <DialogFooter className="pt-2 border-t border-brand-mitti">
            <Button variant="outline" onClick={() => setFmcgModalOpen(false)} className="rounded-xl text-xs font-bold">
              Close Catalog
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Security Owner PIN Dialog for Product Deletion */}
      <OwnerPinDialog
        open={pinModalOpen}
        onClose={() => {
          setPinModalOpen(false);
          setPendingDeleteProduct(null);
        }}
        onSuccess={() => {
          if (pendingDeleteProduct) {
            performDeleteProduct(pendingDeleteProduct);
            setPendingDeleteProduct(null);
          }
        }}
        shopId={currentShopId}
        title="Delete Protected Product"
      />

    </div>
  );
}
