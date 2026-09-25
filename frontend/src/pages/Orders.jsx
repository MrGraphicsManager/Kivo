import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, money } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Search, 
  ClipboardList, 
  Receipt, 
  ArrowUpRight, 
  Calendar, 
  Banknote, 
  QrCode, 
  Wallet,
  ChevronRight,
  TrendingUp,
  Printer,
  Plus
} from "lucide-react";

export default function Orders() {
  const nav = useNavigate();
  const [orders, setOrders] = useState([]);
  const [status, setStatus] = useState("all");
  const [payment, setPayment] = useState("all");
  const [q, setQ] = useState("");

  const load = () => {
    api.get("/orders", { params: { status, payment_method: payment, q: q || undefined } })
      .then(r => setOrders(Array.isArray(r.data) ? r.data : []))
      .catch(() => setOrders([]));
  };

  useEffect(() => { 
    load(); 
    /* eslint-disable-next-line */ 
  }, [status, payment, q]);

  // Aggregate stats
  const totalVolume = useMemo(() => {
    return orders.reduce((acc, o) => acc + Number(o.total || 0), 0);
  }, [orders]);

  const cashOrdersCount = useMemo(() => {
    return orders.filter(o => o.payment_method === "cash").length;
  }, [orders]);

  const upiOrdersCount = useMemo(() => {
    return orders.filter(o => o.payment_method === "upi").length;
  }, [orders]);

  return (
    <div className="space-y-6 animate-fade-up max-w-[1400px] mx-auto pb-16 font-sans selection:bg-brand-terracotta/20">
      
      {/* =========================================================
          HERO BANNER
      ========================================================= */}
      <div className="bg-gradient-to-r from-brand-indigo via-[#261E7A] to-brand-indigo text-white p-7 md:p-8 rounded-3xl shadow-lg border-2 border-brand-indigo/40 flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-brand-terracotta/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-brand-terracotta flex items-center justify-center shrink-0 shadow-md">
            <ClipboardList className="w-7 h-7 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs uppercase tracking-widest text-white/60 font-semibold font-mono">SALES AUDIT</span>
              <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-xs font-bold text-white">
                {orders.length} Invoices Generated
              </span>
            </div>
            <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight text-white">
              Orders & Invoices
            </h1>
          </div>
        </div>

        {/* Summary Badges & Quick Bill */}
        <div className="relative z-10 flex flex-wrap items-center gap-3">
          <div className="bg-white/10 border border-white/15 px-4 py-2 rounded-2xl backdrop-blur-md">
            <div className="text-[10px] uppercase font-bold text-white/60">Total Order Volume</div>
            <div className="font-display text-2xl font-bold text-white">{money(totalVolume)}</div>
          </div>
          <Button
            onClick={() => nav("/app/pos")}
            className="h-12 px-6 rounded-2xl bg-brand-terracotta hover:bg-brand-terracotta/90 text-white font-bold text-sm shadow-glow active:scale-95 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Create New Bill
          </Button>
        </div>
      </div>

      {/* =========================================================
          CONTROLS: SEARCH & FILTER PILLS
      ========================================================= */}
      <div className="bg-white p-4 rounded-3xl border-2 border-brand-mitti shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-brand-indigo/40" />
          <Input 
            placeholder="Search by order # (e.g. 8821) or customer name…" 
            value={q} 
            onChange={(e) => setQ(e.target.value)} 
            data-testid="orders-search" 
            className="pl-11 pr-4 h-11 rounded-2xl border-brand-mitti bg-brand-sand/50 text-sm font-medium text-brand-indigo" 
          />
        </div>

        {/* Filter Groups */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Status Filter */}
          <div className="flex items-center bg-brand-sand p-1 rounded-2xl border border-brand-mitti overflow-x-auto max-w-full">
            {[
              { id: "all", label: "All Status" },
              { id: "paid", label: "Paid" },
              { id: "udhaar", label: "Udhaar" },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setStatus(tab.id)}
                data-testid={`filter-status-${tab.id}`}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  status === tab.id 
                    ? "bg-white text-brand-indigo shadow-xs" 
                    : "text-brand-indigo/60 hover:text-brand-indigo"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Payment Method Filter */}
          <div className="flex items-center bg-brand-sand p-1 rounded-2xl border border-brand-mitti overflow-x-auto max-w-full">
            {[
              { id: "all", label: "All Pay" },
              { id: "cash", label: "Cash" },
              { id: "upi", label: "UPI" },
              { id: "udhaar", label: "Udhaar" },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setPayment(tab.id)}
                data-testid={`filter-payment-${tab.id}`}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  payment === tab.id 
                    ? "bg-white text-brand-indigo shadow-xs" 
                    : "text-brand-indigo/60 hover:text-brand-indigo"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* =========================================================
          ORDERS TABLE
      ========================================================= */}
      <div className="overflow-x-auto rounded-3xl border-2 border-brand-mitti bg-white shadow-xs">
        <table className="w-full text-sm font-sans text-brand-indigo">
          <thead className="bg-brand-sand border-b-2 border-brand-mitti text-left text-[11px] uppercase tracking-wider font-bold text-brand-terracotta">
            <tr>
              <th className="px-6 py-4">Invoice #</th>
              <th className="px-6 py-4">Date & Time</th>
              <th className="px-6 py-4">Customer</th>
              <th className="px-6 py-4 text-center">Items Count</th>
              <th className="px-6 py-4 text-right">Bill Total</th>
              <th className="px-6 py-4 text-center">Payment Method</th>
              <th className="px-6 py-4 text-center">Status</th>
              <th className="px-6 py-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-mitti" data-testid="orders-table">
            {orders.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-16 text-brand-indigo/60">
                  <Receipt className="w-10 h-10 mx-auto mb-2 text-brand-indigo/30" />
                  No orders found matching this filter.
                </td>
              </tr>
            ) : (
              orders.map(o => (
                <tr 
                  key={o.id} 
                  onClick={() => nav(`/app/orders/${o.id}`)} 
                  data-testid={`order-row-${o.id}`}
                  className="hover:bg-brand-sand/50 transition-colors cursor-pointer group"
                >
                  {/* Order Number */}
                  <td className="px-6 py-4">
                    <div className="font-heading font-extrabold text-base text-brand-indigo group-hover:text-brand-terracotta transition-colors flex items-center gap-1.5">
                      <Receipt className="w-4 h-4 text-brand-indigo/40 group-hover:text-brand-terracotta" />
                      <span>#{o.order_no || o.id}</span>
                    </div>
                  </td>

                  {/* Date & Time */}
                  <td className="px-6 py-4 text-xs text-brand-indigo/70 font-mono">
                    {(o.created_at || "").slice(0, 16).replace("T", " ")}
                  </td>

                  {/* Customer & Cashier */}
                  <td className="px-6 py-4">
                    <div className="font-bold text-sm text-brand-indigo">
                      {o.customer_name || "Walk-in Customer"}
                    </div>
                    {o.billed_by && (
                      <div className="text-[11px] text-brand-indigo/60 flex items-center gap-1 mt-0.5 font-medium">
                        <span className="text-slate-400">Cashier:</span>
                        <span className="bg-brand-sand px-1.5 py-0.2 rounded text-[10px] text-brand-indigo font-bold border border-brand-mitti/60">
                          {o.billed_by}
                        </span>
                      </div>
                    )}
                  </td>

                  {/* Items */}
                  <td className="px-6 py-4 text-center">
                    <span className="bg-brand-sand px-2.5 py-1 rounded-xl text-xs font-bold border border-brand-mitti">
                      {o.items?.length || 1} items
                    </span>
                  </td>

                  {/* Total */}
                  <td className="px-6 py-4 text-right font-display font-extrabold text-lg text-brand-indigo">
                    {money(o.total)}
                  </td>

                  {/* Payment Method */}
                  <td className="px-6 py-4 text-center">
                    <span className={`text-[10px] uppercase font-bold px-2.5 py-1 rounded-full border ${
                      o.payment_method === "upi" ? "bg-blue-50 text-blue-800 border-blue-200" :
                      o.payment_method === "cash" ? "bg-emerald-50 text-emerald-800 border-emerald-200" :
                      "bg-orange-50 text-orange-800 border-orange-200"
                    }`}>
                      {o.payment_method}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4 text-center">
                    <span className={`text-[10px] uppercase font-bold px-2.5 py-1 rounded-full ${
                      o.status === "paid" ? "bg-emerald-100 text-emerald-800" : "bg-orange-100 text-brand-terracotta"
                    }`}>
                      {o.status}
                    </span>
                  </td>

                  {/* Action Link */}
                  <td className="px-6 py-4 text-right">
                    <button className="text-xs font-bold text-brand-terracotta hover:underline inline-flex items-center gap-1">
                      <span>Invoice</span>
                      <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}
