import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, money } from "@/lib/api";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { 
  Plus, 
  ChevronRight, 
  Search, 
  Users, 
  Wallet, 
  Phone, 
  ArrowUpRight, 
  Sparkles, 
  MessageSquare, 
  CheckCircle2, 
  Receipt,
  UserPlus,
  Edit2
} from "lucide-react";

export default function Customers() {
  const nav = useNavigate();
  const [items, setItems] = useState(() => getStoredCustomers());
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all"); // "all", "udhaar", "paid"
  const [form, setForm] = useState({ open: false, id: null, name: "", phone: "", notes: "" });
  const [busy, setBusy] = useState(false);

  const load = () => {
    api.get("/customers", { params: { q: q || undefined } })
      .then(r => setItems(Array.isArray(r.data) ? r.data : []))
      .catch(() => setItems([]));
  };

  useEffect(() => {
    load();
    /* eslint-disable-next-line */
  }, [q]);

  useEffect(() => {
    const handleCustomersUpdated = () => {
      setItems(getStoredCustomers());
    };
    window.addEventListener("dukaan_customers_updated", handleCustomersUpdated);
    return () => window.removeEventListener("dukaan_customers_updated", handleCustomersUpdated);
  }, []);

  // Aggregate stats
  const totalUdhaarPending = useMemo(() => {
    return items.reduce((acc, it) => acc + (it.total_pending || it.udhaar || 0), 0);
  }, [items]);

  const customersWithUdhaar = useMemo(() => {
    return items.filter(c => (c.total_pending || c.udhaar || 0) > 0);
  }, [items]);

  const totalPurchasesSum = useMemo(() => {
    return items.reduce((acc, it) => acc + (it.total_purchases || it.totalSpent || 0), 0);
  }, [items]);

  // Filtered customer list
  const filtered = useMemo(() => {
    return items.filter(c => {
      if (filter === "udhaar") return (c.total_pending || c.udhaar || 0) > 0;
      if (filter === "paid") return (c.total_pending || c.udhaar || 0) <= 0;
      return true;
    });
  }, [items, filter]);

  const save = () => {
    if (!form.name.trim()) return toast.error("Customer name is required");
    const newCustomer = {
      id: form.id || `c_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      name: form.name.trim(),
      phone: form.phone.trim(),
      notes: form.notes.trim(),
      total_purchases: Number(form.total_purchases || 0),
      totalSpent: Number(form.total_purchases || 0),
      total_paid: Number(form.total_paid || 0),
      total_pending: Number(form.total_pending || 0),
      udhaar: Number(form.total_pending || 0),
      created_at: form.created_at || new Date().toISOString()
    };

    // ⚡ STEP 1: INSTANT LOCAL SAVE (0.001 SEC)
    const current = getStoredCustomers();
    const idx = current.findIndex(x => x.id === newCustomer.id || (x.phone && newCustomer.phone && x.phone === newCustomer.phone));
    let updated;
    if (idx >= 0) {
      updated = [...current];
      updated[idx] = { ...updated[idx], ...newCustomer };
    } else {
      updated = [newCustomer, ...current];
    }
    saveStoredCustomers(updated);
    setItems(updated);
    toast.success(form.id ? `⚡ Customer "${newCustomer.name}" updated!` : `⚡ Customer "${newCustomer.name}" added to directory!`);
    setForm({ open: false, id: null, name: "", phone: "", notes: "" });

    // ⚡ STEP 2: ASYNC BACKGROUND SYNC
    if (form.id && !form.id.startsWith("c_")) {
      api.put(`/customers/${form.id}`, newCustomer).catch(() => {});
    } else {
      api.post("/customers", newCustomer).then(res => {
        if (res?.data?.id && res.data.id !== newCustomer.id) {
          const custs = getStoredCustomers();
          const cIdx = custs.findIndex(c => c.id === newCustomer.id);
          if (cIdx !== -1) {
            custs[cIdx].id = res.data.id;
            saveStoredCustomers(custs);
            setItems([...custs]);
          }
        }
      }).catch(() => {});
    }
  };

  return (
    <div className="space-y-6 animate-fade-up max-w-[1400px] mx-auto pb-16 font-sans">
      
      {/* =========================================================
          HERO BANNER & TOP STATS
      ========================================================= */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 dark:from-slate-950 dark:via-indigo-950/80 dark:to-slate-950 text-white p-6 sm:p-8 rounded-3xl shadow-lg border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex items-center gap-4">
          <div className="w-13 h-13 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center shrink-0 text-blue-400">
            <Users className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold font-mono">CUSTOMER DIRECTORY</span>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-[11px] font-bold text-blue-300 border border-blue-500/30">
                Khata Active
              </span>
            </div>
            <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight text-white">
              Customers & Khata
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Record customer profiles, track credit ledgers, and send instant WhatsApp payment reminders.
            </p>
          </div>
        </div>

        {/* Action Button */}
        <div className="relative z-10 flex items-center gap-3">
          <Button
            onClick={() => setForm({ open: true, name: "", phone: "", notes: "" })}
            data-testid="add-customer-btn"
            className="h-11 px-5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Customer</span>
          </Button>
        </div>
      </div>

      {/* =========================================================
          KPI METRIC CARDS
      ========================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>Total Customers</span>
            <Users className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
            {items.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Registered in shop directory
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>Accounts with Udhaar</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">
            {customersWithUdhaar.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Active credit balance pending
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>Total Pending Udhaar</span>
            <Wallet className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-extrabold text-rose-600 dark:text-rose-400 mt-1">
            {money(totalUdhaarPending)}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Total market credit receivable
          </div>
        </div>
      </div>

      {/* =========================================================
          CONTROLS: SEARCH & FILTER TABS
      ========================================================= */}
      <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        
        {/* Search by Name or Phone */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input 
            data-testid="customer-search" 
            placeholder="Search by customer name or phone number…" 
            value={q} 
            onChange={(e) => setQ(e.target.value)} 
            className="pl-10 pr-4 h-10 rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 text-xs font-medium text-slate-900 dark:text-white" 
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200 dark:border-slate-700 overflow-x-auto max-w-full gap-1">
          {[
            { id: "all", label: `All (${items.length})` },
            { id: "udhaar", label: `Has Udhaar (${customersWithUdhaar.length})` },
            { id: "paid", label: "Clean Ledger" },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                filter === tab.id 
                  ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-white shadow-2xs" 
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* =========================================================
          CUSTOMER CARDS GRID
      ========================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="customers-list">
        {filtered.length === 0 ? (
          <div className="col-span-full text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 p-8 shadow-2xs">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">No customers found</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">Add your first customer to track their purchase history and credit.</p>
            <Button
              onClick={() => setForm({ open: true, name: "", phone: "", notes: "" })}
              className="mt-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold"
            >
              + Add Customer
            </Button>
          </div>
        ) : (
          filtered.map(c => {
            const hasPending = (c.total_pending || c.udhaar || 0) > 0;
            const initials = (c.name || "Customer").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

            return (
              <div 
                key={c.id} 
                data-testid={`customer-${c.id}`}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-2xs hover:border-blue-300 dark:hover:border-slate-700 hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Top Bar: Avatar, Name & Status */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 grid place-items-center font-extrabold text-sm shadow-2xs">
                        {initials}
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {c.name}
                        </h3>
                        <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5 font-mono">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{c.phone || "No phone"}</span>
                        </div>
                      </div>
                    </div>

                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      hasPending 
                        ? "bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800" 
                        : "bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800"
                    }`}>
                      {hasPending ? "Udhaar Due" : "Settled"}
                    </span>
                  </div>

                  {/* Financial Ledger Mini Summary */}
                  <div className="mt-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 grid grid-cols-3 gap-2 text-center">
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-400">Purchases</div>
                      <div className="font-bold text-xs text-slate-900 dark:text-white mt-0.5">
                        {money(c.total_purchases || c.totalSpent || 0)}
                      </div>
                    </div>
                    <div className="border-x border-slate-200 dark:border-slate-700">
                      <div className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400">Paid</div>
                      <div className="font-bold text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">
                        {money(c.total_paid || 0)}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-bold text-rose-600 dark:text-rose-400">Udhaar</div>
                      <div className="font-bold text-xs text-rose-600 dark:text-rose-400 mt-0.5">
                        {money(c.total_pending || c.udhaar || 0)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Actions: WhatsApp Reminder + Edit + View Ledger */}
                <div className="mt-3.5 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  {hasPending && c.phone ? (
                    <a
                      href={`https://wa.me/91${c.phone}?text=${encodeURIComponent(
                        `Hello ${c.name}, this is a gentle reminder from Dukaan that your pending balance is ${money(c.total_pending || c.udhaar)}. Please clear it at your convenience. Thank you!`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] shadow-2xs active:scale-95 transition-all flex items-center gap-1"
                    >
                      <MessageSquare className="w-3 h-3" />
                      <span>WhatsApp</span>
                    </a>
                  ) : (
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Clean Ledger</span>
                    </span>
                  )}

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setForm({
                          open: true,
                          id: c.id,
                          name: c.name,
                          phone: c.phone || "",
                          notes: c.notes || "",
                          total_purchases: c.total_purchases,
                          total_paid: c.total_paid,
                          total_pending: c.total_pending,
                          created_at: c.created_at
                        });
                      }}
                      className="text-[11px] font-bold text-slate-600 dark:text-slate-300 hover:text-blue-600 border border-slate-200 dark:border-slate-700 px-2 py-1 rounded-lg hover:border-blue-400 transition-colors flex items-center gap-1"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Edit</span>
                    </button>

                    <button
                      onClick={() => nav(`/app/customers/${c.id}`)}
                      className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline transition-colors flex items-center gap-0.5"
                    >
                      <span>Ledger</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* =========================================================
          ADD / EDIT CUSTOMER MODAL
      ========================================================= */}
      <Dialog open={form.open} onOpenChange={(o) => setForm({ ...form, open: o })}>
        <DialogContent className="max-w-md rounded-3xl p-6 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
          <DialogHeader>
            <DialogTitle className="font-display text-xl text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              <span>{form.id ? "Edit Customer Details" : "Add Customer to Directory"}</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2 text-sm">
            <div>
              <Label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">Customer Full Name *</Label>
              <Input
                data-testid="cf-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Ramesh Patel"
                className="mt-1 h-10 rounded-xl border-slate-200 dark:border-slate-800 text-sm font-semibold"
              />
            </div>

            <div>
              <Label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">10-Digit Mobile Number</Label>
              <Input
                data-testid="cf-phone"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="9825100000"
                maxLength={10}
                className="mt-1 h-10 rounded-xl border-slate-200 dark:border-slate-800 font-mono text-xs"
              />
            </div>

            <div>
              <Label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">Address / Khata Remarks</Label>
              <Input
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="e.g. Regular buyer, House #42"
                className="mt-1 h-10 rounded-xl border-slate-200 dark:border-slate-800 text-xs"
              />
            </div>
          </div>

          <DialogFooter className="mt-4 gap-2">
            <Button 
              variant="outline" 
              onClick={() => setForm({ open: false, id: null, name: "", phone: "", notes: "" })}
              className="rounded-xl border-slate-200 dark:border-slate-700 font-bold text-xs"
            >
              Cancel
            </Button>
            <Button 
              onClick={save} 
              disabled={busy} 
              className="rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs h-10 px-5 shadow-md"
            >
              {busy ? "Saving..." : form.id ? "Update Customer" : "Save to Directory"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
