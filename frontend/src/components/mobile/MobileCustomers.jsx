import React, { useState, useEffect } from "react";
import { ArrowLeft, Search, Plus, Phone, Users, Wallet, ArrowUpRight, MessageSquare, X, Receipt } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import MobileBottomNav from "./MobileBottomNav";

const DEFAULT_CUSTOMERS = [];

export default function MobileCustomers({ onBack, onTabChange }) {
  const [search, setSearch] = useState("");
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newAddress, setNewAddress] = useState("");

  useEffect(() => {
    let active = true;
    api.get("/customers")
      .then((res) => {
        if (active) setCustomers(Array.isArray(res.data) ? res.data : []);
      })
      .catch(() => {
        if (active) setCustomers([]);
      });
    return () => { active = false; };
  }, []);



  const filtered = customers.filter((c) => {
    const cName = (c.name || "").toLowerCase();
    const cPhone = c.phone || "";
    return cName.includes(search.toLowerCase()) || cPhone.includes(search);
  });

  const handleAddCustomer = (e) => {
    e.preventDefault();
    if (!newName.trim() || !newPhone.trim()) {
      toast.error("Please enter customer name and phone number");
      return;
    }
    api.post("/customers", {
      name: newName.trim(),
      phone: newPhone.trim(),
      address: newAddress.trim(),
    })
      .then((res) => {
        const newCust = res.data;
        setCustomers((prev) => [newCust, ...prev]);
        setShowAddModal(false);
        setNewName("");
        setNewPhone("");
        setNewAddress("");
        toast.success(`Customer ${newCust.name} added!`);
      })
      .catch((err) => {
        toast.error(err?.response?.data?.detail || "Unable to add customer");
      });
  };

  const handleWhatsAppCustomer = (c) => {
    const text = encodeURIComponent(
      `Hello ${c.name}! Thank you for being a valued customer at our store. Let us know if you need any groceries or supplies delivered today!`
    );
    window.open(`https://wa.me/91${c.phone}?text=${text}`, "_blank");
  };

  return (
    <div className="min-h-screen bg-slate-50 max-w-md mx-auto pb-24 select-none relative">
      <header className="sticky top-0 z-30 bg-white border-b border-slate-100 px-4 py-3 shadow-2xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="w-9 h-9 rounded-full border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 cursor-pointer active:scale-95 transition-transform"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-base font-black text-slate-900 leading-tight">Customer Directory</h1>
              <p className="text-[11px] font-semibold text-slate-400">{customers.length} Registered Buyers & Khata</p>
            </div>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-3 py-1.5 bg-[#0066FF] hover:bg-blue-700 active:scale-95 text-white font-black text-xs rounded-xl shadow-md shadow-blue-500/20 flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>
        </div>

        {/* Search */}
        <div className="mt-3 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by customer name or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 outline-none focus:border-[#0066FF] focus:bg-white transition-all"
          />
        </div>
      </header>

      {/* Customer Rows */}
      <div className="p-4 space-y-2.5">
        {filtered.map((c) => {
          const initials = (c.name || "Customer")
            .split(" ")
            .map((n) => n[0])
            .join("")
            .slice(0, 2)
            .toUpperCase();

          return (
            <div
              key={c.id}
              onClick={() => setSelectedCustomer(c)}
              className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-2xs flex items-center justify-between gap-3 cursor-pointer hover:border-blue-200 transition-colors"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#0066FF] flex items-center justify-center font-black text-xs shrink-0">
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-xs font-bold text-slate-900 truncate">{c.name}</h3>
                  <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400">
                    <span className="font-mono">{c.phone}</span>
                    <span className="text-slate-300">·</span>
                    <span>{c.bills || 0} Bills</span>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-xs font-black text-slate-900">₹ {c.totalSpent || 0}</div>
                {(c.udhaar || 0) > 0 ? (
                  <div className="text-[10px] font-extrabold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full mt-0.5 inline-block">
                    ₹ {c.udhaar} Udhaar
                  </div>
                ) : (
                  <div className="text-[10px] font-bold text-emerald-600 mt-0.5">Cleared</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Customer Detail Sheet */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-[#0066FF] text-white flex items-center justify-center font-black text-xs">
                  {selectedCustomer.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-sm font-black text-slate-900">{selectedCustomer.name}</h2>
                  <p className="text-[11px] font-mono text-slate-400">+91 {selectedCustomer.phone}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-4">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Lifetime Purchases</div>
                <div className="text-base font-black text-slate-900 mt-0.5">₹ {selectedCustomer.totalSpent || 0}</div>
              </div>
              <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200">
                <div className="text-[10px] font-bold text-amber-700 uppercase">Outstanding Udhaar</div>
                <div className="text-base font-black text-amber-900 mt-0.5">₹ {selectedCustomer.udhaar || 0}</div>
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <button
                onClick={() => handleWhatsAppCustomer(selectedCustomer)}
                className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Send WhatsApp</span>
              </button>
              <a
                href={`tel:${selectedCustomer.phone}`}
                className="px-4 py-3 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Phone className="w-4 h-4" />
                <span>Call</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Add Customer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-black text-slate-900">Add Customer to Khata</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddCustomer} className="mt-4 space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Customer Full Name</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Ramesh Bhai Patel"
                  className="w-full bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 outline-none focus:border-[#0066FF]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Mobile Number</label>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value.replace(/\D/g, ""))}
                  placeholder="10-digit phone number"
                  className="w-full bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 outline-none focus:border-[#0066FF]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Area / Address (Optional)</label>
                <input
                  type="text"
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  placeholder="e.g. Station Road"
                  className="w-full bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 outline-none focus:border-[#0066FF]"
                />
              </div>

              <button
                type="submit"
                className="w-full mt-2 py-3 bg-[#0066FF] hover:bg-blue-700 active:scale-[0.99] text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
              >
                Save Customer
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Dock Nav */}
      <MobileBottomNav activeTab="customers" onTabChange={onTabChange} />
    </div>
  );
}
