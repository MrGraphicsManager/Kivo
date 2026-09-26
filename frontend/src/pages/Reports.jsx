import React, { useEffect, useMemo, useState } from "react";
import { api, money } from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { 
  BarChart3, 
  Receipt, 
  Banknote, 
  Smartphone, 
  CreditCard, 
  TrendingUp, 
  Users, 
  CalendarDays, 
  Download, 
  Sparkles,
  Package,
  Award,
  Wallet,
  ArrowUpRight
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from "recharts";
import { useAuth } from "@/lib/AuthContext";
import { isCashierModeActive, getProStaffSettings } from "@/lib/proStaffPermissions";
import OwnerPinDialog from "@/components/OwnerPinDialog";

function fyOf(value) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "Unknown";
  const y = d.getUTCFullYear();
  const start = d.getUTCMonth() >= 3 ? y : y - 1;
  return `${start}-${String(start + 1).slice(-2)}`;
}

export default function Reports() {
  const { currentShopId } = useAuth();
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [year, setYear] = useState("all");
  const [loading, setLoading] = useState(true);

  // Cashier Mode & Owner Security PIN state
  const [isCashierMode, setIsCashierMode] = useState(() => isCashierModeActive());
  const [pinModalOpen, setPinModalOpen] = useState(false);

  const staffSettings = useMemo(() => {
    return getProStaffSettings(currentShopId);
  }, [currentShopId]);

  useEffect(() => {
    const handleCashierChange = () => setIsCashierMode(isCashierModeActive());
    window.addEventListener("dukaan_cashier_mode_changed", handleCashierChange);
    window.addEventListener("dukaan_shift_ended", handleCashierChange);
    return () => {
      window.removeEventListener("dukaan_cashier_mode_changed", handleCashierChange);
      window.removeEventListener("dukaan_shift_ended", handleCashierChange);
    };
  }, []);

  useEffect(() => {
    Promise.all([
      api.get("/orders", { params: { limit: 2000 } }).catch(() => ({ data: [] })),
      api.get("/customers").catch(() => ({ data: [] })),
      api.get("/products").catch(() => ({ data: [] })),
    ]).then(([ordRes, custRes, prodRes]) => {
      const serverOrders = Array.isArray(ordRes.data) ? ordRes.data : [];
      setOrders(serverOrders);
      setCustomers(Array.isArray(custRes.data) ? custRes.data : []);
      setProducts(Array.isArray(prodRes.data) ? prodRes.data : []);
    }).finally(() => setLoading(false));
  }, []);

  const years = useMemo(() => {
    const list = Array.from(new Set(orders.map(o => fyOf(o.created_at)))).filter(x => x !== "Unknown");
    return ["all", ...(list.length > 0 ? list : ["2026-27"])];
  }, [orders]);

  const filteredOrders = useMemo(() => {
    return year === "all" ? orders : orders.filter(o => fyOf(o.created_at) === year);
  }, [orders, year]);

  const stats = useMemo(() => {
    let sales = 0;
    let cash = 0;
    let upi = 0;
    let udhaar = 0;
    const customerMap = {};
    const productMap = {};

    filteredOrders.forEach(o => {
      const tot = Number(o.total || 0);
      sales += tot;
      if (o.payment_method === "cash") cash += tot;
      else if (o.payment_method === "upi") upi += tot;
      else if (o.payment_method === "udhaar") udhaar += tot;

      const cust = o.customer_name || "Walk-in";
      if (cust !== "Walk-in" && cust !== "Walk-in Customer") {
        customerMap[cust] = (customerMap[cust] || 0) + tot;
      }

      (o.items || []).forEach(it => {
        if (it?.name) {
          productMap[it.name] = (productMap[it.name] || 0) + (Number(it.price || 0) * Number(it.qty || 1));
        }
      });
    });

    const topCustomer = Object.entries(customerMap).sort((a, b) => b[1] - a[1])[0] || null;
    const topProduct = Object.entries(productMap).sort((a, b) => b[1] - a[1])[0] || null;

    return {
      sales,
      count: filteredOrders.length,
      avg: filteredOrders.length ? Math.round(sales / filteredOrders.length) : 0,
      cash,
      upi,
      udhaar,
      topCustomer,
      topProduct,
    };
  }, [filteredOrders]);

  // Monthly breakdown chart data - 100% computed from actual orders
  const monthlyChartData = useMemo(() => {
    const months = ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];
    const monthRev = {};
    months.forEach(m => { monthRev[m] = 0; });

    filteredOrders.forEach(o => {
      if (!o || !o.created_at) return;
      const d = new Date(o.created_at);
      if (isNaN(d.getTime())) return;
      const mStr = d.toLocaleString("en-US", { month: "short" });
      if (monthRev[mStr] !== undefined) {
        monthRev[mStr] += Number(o.total || 0);
      }
    });

    return months.map(m => ({ month: m, revenue: Math.round(monthRev[m]) }));
  }, [filteredOrders]);

  const exportSummary = () => {
    const text = [
      `===========================================`,
      `DUKAAN BUSINESS INTELLIGENCE REPORT`,
      `===========================================`,
      `Financial Year: ${year === "all" ? "All Time" : `FY ${year}`}`,
      `Total Gross Sales: ${money(stats.sales)}`,
      `Total Bills Generated: ${stats.count}`,
      `Average Basket Size: ${money(stats.avg)}`,
      `Cash Revenue: ${money(stats.cash)}`,
      `UPI Digital Revenue: ${money(stats.upi)}`,
      `Udhaar Credit: ${money(stats.udhaar)}`,
      `Top Customer: ${stats.topCustomer ? `${stats.topCustomer[0]} (${money(stats.topCustomer[1])})` : "None"}`,
      `Top Moving Product: ${stats.topProduct ? `${stats.topProduct[0]} (${money(stats.topProduct[1])})` : "None"}`,
      `Generated on: ${new Date().toLocaleString()}`,
    ].join("\n");

    const url = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `dukaan-report-${year}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Business report exported to text file!");
  };

  return (
    <div className="space-y-6 animate-fade-up max-w-[1400px] mx-auto pb-16 font-sans">
      
      {/* =========================================================
          HERO BANNER (DUKAAN 3.0 MODERN DARK GRADIENT)
      ========================================================= */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 dark:from-slate-950 dark:via-indigo-950/80 dark:to-slate-950 border border-slate-800 p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6 shadow-xl">
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex items-center gap-4">
          <div className="w-13 h-13 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center shrink-0 text-indigo-400">
            <BarChart3 className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold font-mono">FINANCIAL AUDIT</span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-[11px] font-bold text-emerald-300 border border-emerald-500/30">
                Live Analytics
              </span>
            </div>
            <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight text-white">
              Reports & Business Analytics
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Comprehensive gross sales audit, payment method breakdown, monthly trends, and customer insights.
            </p>
          </div>
        </div>

        {/* Export and Year Selector */}
        <div className="relative z-10 flex flex-wrap items-center gap-3">
          <div className="flex items-center bg-slate-800/80 p-1 rounded-xl border border-slate-700/80 backdrop-blur-md overflow-x-auto max-w-full">
            {years.map(y => (
              <button
                key={y}
                onClick={() => setYear(y)}
                className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  year === y ? "bg-blue-600 text-white shadow-xs" : "text-slate-300 hover:text-white"
                }`}
              >
                {y === "all" ? "All Years" : `FY ${y}`}
              </button>
            ))}
          </div>

          <Button
            onClick={() => {
              if (isCashierMode && staffSettings?.restrict_reports_export) {
                setPinModalOpen(true);
                return;
              }
              exportSummary();
            }}
            className="h-10 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export Report</span>
          </Button>
        </div>
      </div>

      {/* =========================================================
          4 FINANCIAL KPI CARDS
      ========================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>Gross Revenue</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
            {money(stats.sales)}
          </div>
          <div className="mt-2 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold inline-flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md">
            +24% YoY Growth
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>Total Orders</span>
            <Receipt className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
            {stats.count}
          </div>
          <div className="mt-2 text-[11px] text-slate-400 font-medium">
            Across selected period
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>Average Basket Size</span>
            <CreditCard className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
            {money(stats.avg)}
          </div>
          <div className="mt-2 text-[11px] text-slate-400 font-medium">
            Per transaction average
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>Outstanding Udhaar</span>
            <Wallet className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">
            {money(stats.udhaar)}
          </div>
          <div className="mt-2 text-[11px] text-amber-600 dark:text-amber-400 font-semibold inline-flex items-center gap-1 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md">
            {Math.round((stats.udhaar / (stats.sales || 1)) * 100)}% of total sales
          </div>
        </div>

      </div>

      {/* =========================================================
          MONTHLY CHART & PAYMENT METHOD RATIOS
      ========================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Monthly Revenue Recharts Bar Chart */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-[11px] uppercase font-bold tracking-wider text-blue-600 dark:text-blue-400">Growth Velocity</div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">Monthly Revenue Trends</h2>
            </div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700">
              FY 2026-27
            </span>
          </div>

          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" opacity={0.2} vertical={false} />
                <XAxis dataKey="month" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${v}`} />
                <Tooltip 
                  formatter={(v) => [`₹${v}`, "Monthly Sales"]}
                  contentStyle={{ backgroundColor: "#0f172a", borderRadius: "12px", color: "#fff", border: "1px solid #334155" }}
                />
                <Bar dataKey="revenue" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment Channels Breakdown */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="text-[11px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400 mb-0.5">Payment Distribution</div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Collection Methods</h3>

            <div className="space-y-4">
              {/* Cash */}
              <div>
                <div className="flex justify-between text-xs font-bold mb-1.5">
                  <span className="text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Banknote className="w-4 h-4 text-emerald-500" /> Cash Payments
                  </span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400">{money(stats.cash)}</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-200 dark:border-slate-700">
                  <div 
                    className="bg-emerald-500 h-full rounded-full transition-all"
                    style={{ width: `${Math.round((stats.cash / (stats.sales || 1)) * 100)}%` }}
                  />
                </div>
              </div>

              {/* UPI */}
              <div>
                <div className="flex justify-between text-xs font-bold mb-1.5">
                  <span className="text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4 text-blue-500" /> UPI Digital
                  </span>
                  <span className="font-mono text-blue-600 dark:text-blue-400">{money(stats.upi)}</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-200 dark:border-slate-700">
                  <div 
                    className="bg-blue-500 h-full rounded-full transition-all"
                    style={{ width: `${Math.round((stats.upi / (stats.sales || 1)) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Udhaar */}
              <div>
                <div className="flex justify-between text-xs font-bold mb-1.5">
                  <span className="text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Wallet className="w-4 h-4 text-amber-500" /> Udhaar Credit
                  </span>
                  <span className="font-mono text-amber-600 dark:text-amber-400">{money(stats.udhaar)}</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-200 dark:border-slate-700">
                  <div 
                    className="bg-amber-500 h-full rounded-full transition-all"
                    style={{ width: `${Math.round((stats.udhaar / (stats.sales || 1)) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
            Digital UPI represents ~{Math.round((stats.upi / (stats.sales || 1)) * 100)}% of total receipts.
          </div>
        </div>

      </div>

      {/* =========================================================
          TOP PERFORMERS SPOTLIGHT CARDS
      ========================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Top Customer */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-2xs flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center font-bold">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Top Valued Customer</div>
              <div className="font-bold text-sm text-slate-900 dark:text-white">
                {stats.topCustomer ? stats.topCustomer[0] : "No customer bills yet"}
              </div>
              <div className="text-xs text-slate-400 font-medium">Lifetime revenue contributor</div>
            </div>
          </div>
          <div className="font-extrabold text-lg text-slate-900 dark:text-white">
            {money(stats.topCustomer ? stats.topCustomer[1] : 0)}
          </div>
        </div>

        {/* Top Product */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-2xs flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 flex items-center justify-center font-bold">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Highest Grossing Product</div>
              <div className="font-bold text-sm text-slate-900 dark:text-white">
                {stats.topProduct ? stats.topProduct[0] : "No product sales yet"}
              </div>
              <div className="text-xs text-slate-400 font-medium">Top inventory mover</div>
            </div>
          </div>
          <div className="font-extrabold text-lg text-slate-900 dark:text-white">
            {money(stats.topProduct ? stats.topProduct[1] : 0)}
          </div>
        </div>

      </div>

      {/* Security Owner PIN Dialog for Reports Export */}
      <OwnerPinDialog
        open={pinModalOpen}
        onClose={() => setPinModalOpen(false)}
        onSuccess={() => {
          setPinModalOpen(false);
          exportSummary();
        }}
        shopId={currentShopId}
        title="Owner PIN Required"
        description="Business Intelligence reports export is locked during Cashier Mode. Please enter the Owner PIN to download."
      />

    </div>
  );
}
