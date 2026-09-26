import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api, money } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { 
  ArrowLeft, 
  Phone, 
  MessageSquare, 
  Receipt, 
  Wallet, 
  Calendar, 
  Plus, 
  ChevronRight,
  UserRound,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Edit2
} from "lucide-react";
import { toast } from "sonner";

export default function CustomerDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const [c, setC] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", phone: "", notes: "" });
  const [busy, setBusy] = useState(false);

  const loadData = () => {
    api.get(`/customers/${id}`)
      .then((r) => {
        const cust = r.data;
        if (!cust) {
          setC(null);
          return;
        }
        setC(cust);
        setEditForm({ name: cust.name || "", phone: cust.phone || "", notes: cust.notes || "" });
        loadCustomerOrders(cust);
      })
      .catch(() => {
        setC(null);
      })
      .finally(() => setLoading(false));
  };
  const loadCustomerOrders = (customer) => {
    setOrders(Array.isArray(customer?.orders) ? customer.orders : []);
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (!c && loading) {
    return (
      <div className="min-h-[400px] grid place-items-center text-brand-indigo/60 font-sans">
        Loading customer ledger…
      </div>
    );
  }

  if (!c) {
    return (
      <div className="min-h-[400px] grid place-items-center text-brand-indigo/60 font-sans">
        <div>
          <p className="text-center font-bold">Customer not found.</p>
          <Button onClick={() => nav("/app/customers")} className="mt-4">Back to Customers</Button>
        </div>
      </div>
    );
  }

  const totals = orders.reduce((a, o) => ({
    purchases: a.purchases + Number(o.total || 0),
    paid: a.paid + Number(o.paid_amount || (o.status === "paid" ? o.total : 0)),
    pending: a.pending + Number(o.pending_amount || (o.status === "udhaar" ? o.total : 0)),
  }), { 
    purchases: Number(c.total_purchases || 0), 
    paid: Number(c.total_paid || 0), 
    pending: Number(c.total_pending || 0) 
  });

  const waLink = () => {
    const phone = (c.phone || "").replace(/\D/g, "");
    const msg = `Hello ${c.name}, here is your account statement from Kivo: Total purchases ${money(totals.purchases)}, Outstanding balance ${money(totals.pending)}. Thank you!`;
    return `https://wa.me/91${phone}?text=${encodeURIComponent(msg)}`;
  };

  const handleUpdateCustomer = (e) => {
    e.preventDefault();
    if (!editForm.name.trim()) {
      toast.error("Customer name is required");
      return;
    }
    const updatedCustomer = {
      ...c,
      name: editForm.name.trim(),
      phone: editForm.phone.trim(),
      notes: editForm.notes.trim(),
      updated_at: new Date().toISOString()
    };

    api.put(`/customers/${c.id}`, updatedCustomer)
      .then((r) => {
        const saved = r.data || updatedCustomer;
        setC(saved);
        setEditForm({ name: saved.name || "", phone: saved.phone || "", notes: saved.notes || "" });
        setEditOpen(false);
        toast.success(`Customer "${saved.name}" details updated!`);
      })
      .catch((err) => {
        toast.error(err?.response?.data?.detail || "Unable to update customer");
      });

  };

  return (
    <div className="space-y-6 animate-fade-up max-w-[1200px] mx-auto pb-16 font-sans selection:bg-brand-terracotta/20">
      
      {/* Back Button & Top Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Button 
          variant="outline" 
          onClick={() => nav("/app/customers")}
          className="rounded-full border-2 border-brand-mitti text-brand-indigo font-bold text-xs hover:border-brand-indigo flex items-center gap-1.5 h-10 px-4 w-fit"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Customers
        </Button>

        <div className="flex flex-wrap items-center gap-2">
          <Button 
            variant="outline"
            onClick={() => setEditOpen(true)}
            className="rounded-full border-2 border-brand-mitti text-brand-indigo font-bold text-xs hover:border-brand-indigo h-10 px-4 flex items-center gap-1.5"
          >
            <Edit2 className="w-3.5 h-3.5 text-brand-terracotta" />
            <span>Edit Details</span>
          </Button>

          {c.phone && (
            <a 
              href={waLink()}
              target="_blank" 
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-4 py-2 rounded-full hover:bg-emerald-100 shadow-xs"
            >
              <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
              <span>WhatsApp Statement</span>
            </a>
          )}

          <Button 
            onClick={() => nav("/app/pos")}
            className="rounded-full bg-brand-terracotta hover:bg-brand-terracotta/90 text-white font-bold text-xs h-10 px-5 shadow-sm active:scale-95 transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> New Bill
          </Button>
        </div>
      </div>

      {/* Customer Hero Banner */}
      <div className="bg-gradient-to-r from-brand-indigo to-[#2A2375] text-white p-7 md:p-8 rounded-3xl shadow-lg border-2 border-brand-indigo/40 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-brand-terracotta text-white grid place-items-center font-display font-extrabold text-2xl shadow-md">
            {c.name ? c.name[0].toUpperCase() : "C"}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs uppercase tracking-widest text-white/60 font-semibold font-mono">CUSTOMER KHATA</span>
              {totals.pending > 0 ? (
                <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-xs font-bold border border-amber-400/30">
                  Pending Udhaar
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 text-xs font-bold border border-emerald-400/30">
                  Clean Account
                </span>
              )}
            </div>
            <h1 className="font-display text-3xl font-bold tracking-tight text-white">{c.name}</h1>
            <div className="text-xs text-white/70 mt-1 flex items-center gap-3 font-mono">
              <span className="flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-white/50" /> {c.phone || "No phone registered"}
              </span>
              <span>·</span>
              <span>{c.notes || "Registered customer"}</span>
            </div>
          </div>
        </div>

        <div className="text-left md:text-right">
          <div className="text-[10px] uppercase font-bold text-white/60">Outstanding Balance</div>
          <div className="font-display text-4xl font-extrabold text-brand-terracotta mt-0.5">
            {money(totals.pending)}
          </div>
        </div>
      </div>

      {/* 3 Ledger Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white rounded-3xl p-6 border-2 border-brand-mitti shadow-xs">
          <div className="text-xs font-bold uppercase tracking-wider text-brand-indigo/60">Total Lifetime Purchases</div>
          <div className="font-display text-3xl font-extrabold text-brand-indigo mt-2">
            {money(totals.purchases)}
          </div>
          <div className="text-xs text-brand-indigo/50 mt-1">{orders.length} transaction records</div>
        </div>

        <div className="bg-white rounded-3xl p-6 border-2 border-brand-mitti shadow-xs">
          <div className="text-xs font-bold uppercase tracking-wider text-emerald-700">Total Cleared & Paid</div>
          <div className="font-display text-3xl font-extrabold text-emerald-700 mt-2">
            {money(totals.paid)}
          </div>
          <div className="text-xs text-emerald-800 font-semibold mt-1">Paid via Cash & UPI</div>
        </div>

        <div className="bg-white rounded-3xl p-6 border-2 border-brand-mitti shadow-xs">
          <div className="text-xs font-bold uppercase tracking-wider text-brand-terracotta">Pending Udhaar Balance</div>
          <div className="font-display text-3xl font-extrabold text-brand-terracotta mt-2">
            {money(totals.pending)}
          </div>
          <div className="text-xs text-amber-800 font-bold mt-1">
            {totals.pending > 0 ? "Pending collection" : "All cleared"}
          </div>
        </div>
      </div>

      {/* Transactions History */}
      <div className="bg-white rounded-3xl border-2 border-brand-mitti shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b-2 border-brand-mitti flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-brand-terracotta" />
            <h3 className="font-heading font-bold text-base text-brand-indigo">Purchase & Invoice History</h3>
          </div>
          <span className="text-xs font-bold text-brand-indigo/50">{orders.length} Bills</span>
        </div>

        <div className="divide-y divide-brand-mitti">
          {orders.length === 0 ? (
            <div className="p-12 text-center text-brand-indigo/60 text-sm">
              No bills recorded for this customer yet. When a bill is created at the POS counter for this customer, it will appear here automatically.
            </div>
          ) : (
            orders.map(o => (
              <div 
                key={o.id} 
                onClick={() => nav(`/app/orders/${o.id}`)}
                className="p-5 hover:bg-brand-sand/40 transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-brand-sand border border-brand-mitti grid place-items-center group-hover:border-brand-terracotta transition-colors">
                    <Receipt className="w-5 h-5 text-brand-indigo/60 group-hover:text-brand-terracotta" />
                  </div>
                  <div>
                    <div className="font-heading font-bold text-base text-brand-indigo group-hover:text-brand-terracotta transition-colors">
                      Invoice #{o.order_no || o.id}
                    </div>
                    <div className="text-xs text-brand-indigo/60 font-mono mt-0.5">
                      {(o.created_at || "").slice(0, 16).replace("T", " ")} · {o.payment_method?.toUpperCase()}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-5">
                  <div className="text-left sm:text-right">
                    <div className="font-display font-extrabold text-xl text-brand-indigo">
                      {money(o.total)}
                    </div>
                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                      o.status === "paid" ? "bg-emerald-100 text-emerald-800" : "bg-orange-100 text-brand-terracotta"
                    }`}>
                      {o.status}
                    </span>
                  </div>

                  <ChevronRight className="w-5 h-5 text-brand-indigo/30 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* =========================================================
          EDIT CUSTOMER MODAL
      ========================================================= */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md bg-white rounded-3xl p-6 border-2 border-brand-mitti">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl font-bold text-brand-indigo flex items-center gap-2">
              <Edit2 className="w-5 h-5 text-brand-terracotta" />
              <span>Edit Customer Profile</span>
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleUpdateCustomer} className="space-y-4 mt-3">
            <div>
              <Label className="text-xs font-bold text-brand-indigo">Customer Name *</Label>
              <Input
                required
                value={editForm.name}
                onChange={e => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                className="mt-1 rounded-xl border-brand-mitti font-bold"
              />
            </div>

            <div>
              <Label className="text-xs font-bold text-brand-indigo">Phone Number</Label>
              <Input
                maxLength={10}
                value={editForm.phone}
                onChange={e => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                className="mt-1 rounded-xl border-brand-mitti font-mono"
                placeholder="10-digit number"
              />
            </div>

            <div>
              <Label className="text-xs font-bold text-brand-indigo">Address / Notes</Label>
              <Input
                value={editForm.notes}
                onChange={e => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
                className="mt-1 rounded-xl border-brand-mitti"
                placeholder="e.g. Regular customer, Flat 102"
              />
            </div>

            <DialogFooter className="mt-5 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditOpen(false)}
                className="rounded-xl border-brand-mitti font-bold text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={busy}
                className="rounded-xl bg-brand-terracotta hover:bg-brand-terracotta/90 text-white font-bold text-xs"
              >
                {busy ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
}
