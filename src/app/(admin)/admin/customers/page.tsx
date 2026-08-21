'use client';

import React, { useEffect, useState } from 'react';
import { 
  Users, Search, Eye, Mail, Phone, MapPin, 
  ShoppingCart, FileText, Loader2, X, DollarSign, Calendar
} from 'lucide-react';

interface CustomerItem {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  whatsapp?: string | null;
  company?: string | null;
  country?: string | null;
  address?: string | null;
  city?: string | null;
  zipCode?: string | null;
  totalSpent: number;
  totalOrders: number;
  totalRFQs: number;
  createdAt: string;
  orders?: any[];
  rfqs?: any[];
}

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerItem | null>(null);
  const [customerDetailLoading, setCustomerDetailLoading] = useState(false);

  const loadCustomers = async () => {
    try {
      const res = await fetch('/api/admin/customers', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setCustomers(data.customers || []);
      }
    } catch (e) {
      console.error('Load customers error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const openCustomerDetails = async (id: string) => {
    setCustomerDetailLoading(true);
    try {
      const res = await fetch(`/api/admin/customers/${id}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedCustomer(data.customer);
      }
    } catch (e) {
      console.error('Customer details error:', e);
    } finally {
      setCustomerDetailLoading(false);
    }
  };

  const filtered = customers.filter(c => 
    !search || 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.email.toLowerCase().includes(search.toLowerCase()) ||
    (c.company && c.company.toLowerCase().includes(search.toLowerCase())) ||
    (c.phone && c.phone.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      
      {/* 1. Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Customer Accounts</h1>
          <p className="text-xs text-white/50 mt-1">
            View registered B2B wholesale buyers, salon clients, order histories, and lifetime spending.
          </p>
        </div>
      </div>

      {/* 2. Search & Stats */}
      <div className="bg-[#191019] border border-white/5 p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="w-full md:w-96 relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, company, phone..."
            className="w-full bg-[#120a12] border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#C21875]"
          />
        </div>

        <span className="text-xs text-white/50 font-mono">
          {customers.length} Registered Accounts
        </span>
      </div>

      {/* 3. Customer Table */}
      {loading ? (
        <div className="min-h-[300px] flex items-center justify-center text-white">
          <Loader2 size={32} className="animate-spin text-[#C21875]" />
        </div>
      ) : (
        <div className="bg-[#191019] border border-white/5 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-white/5 bg-[#140d14] text-white/40 uppercase font-mono tracking-wider text-[10px]">
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-3">Company / Location</th>
                  <th className="py-3 px-3">Contact</th>
                  <th className="py-3 px-3 text-center">Orders</th>
                  <th className="py-3 px-3 text-center">RFQs</th>
                  <th className="py-3 px-3 text-right">Total Spent</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-white/40 italic">
                      No customer accounts found.
                    </td>
                  </tr>
                ) : (
                  filtered.map((c) => (
                    <tr key={c.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full bg-[#C21875]/20 border border-[#C21875]/40 flex items-center justify-center font-bold text-[#D6B36A] shrink-0">
                            {c.name.slice(0, 1).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-bold text-white block text-xs">{c.name}</span>
                            <span className="text-[10px] text-white/40">{c.email}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-3">
                        <span className="text-white/80 block">{c.company || 'Individual / Salon'}</span>
                        <span className="text-[10px] text-white/40">{c.city ? `${c.city}, ` : ''}{c.country || 'Global'}</span>
                      </td>

                      <td className="py-3.5 px-3">
                        <span className="text-white/70 block font-mono text-[11px]">{c.phone || c.whatsapp || 'No Phone'}</span>
                        <span className="text-[10px] text-white/40">Joined {new Date(c.createdAt).toLocaleDateString()}</span>
                      </td>

                      <td className="py-3.5 px-3 text-center">
                        <span className="font-mono font-bold text-white bg-white/5 px-2 py-0.5 rounded">
                          {c.totalOrders}
                        </span>
                      </td>

                      <td className="py-3.5 px-3 text-center">
                        <span className="font-mono font-bold text-[#D6B36A] bg-[#D6B36A]/10 px-2 py-0.5 rounded">
                          {c.totalRFQs}
                        </span>
                      </td>

                      <td className="py-3.5 px-3 text-right">
                        <span className="font-mono font-bold text-emerald-400 text-sm">
                          ${c.totalSpent.toFixed(2)}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => openCustomerDetails(c.id)}
                          className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-[#C21875] text-white text-xs font-bold transition-all"
                        >
                          View History
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. CUSTOMER DETAILS MODAL */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#191019] border border-white/10 w-full max-w-3xl max-h-[90vh] rounded-3xl overflow-hidden shadow-2xl flex flex-col">
            <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-[#140d14]">
              <div>
                <h3 className="text-sm font-bold text-white">Customer Account: {selectedCustomer.name}</h3>
                <span className="text-[10px] text-[#D6B36A] font-mono">{selectedCustomer.email}</span>
              </div>
              <button onClick={() => setSelectedCustomer(null)} className="text-white/60 hover:text-white"><X size={18} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Info Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-[#140d14] p-3.5 rounded-xl border border-white/5">
                  <p className="text-[10px] uppercase font-mono text-white/40">Total Lifetime Spend</p>
                  <p className="text-xl font-bold text-emerald-400 font-mono mt-1">${selectedCustomer.totalSpent.toFixed(2)}</p>
                </div>
                <div className="bg-[#140d14] p-3.5 rounded-xl border border-white/5">
                  <p className="text-[10px] uppercase font-mono text-white/40">Orders Placed</p>
                  <p className="text-xl font-bold text-white font-mono mt-1">{selectedCustomer.orders?.length || 0}</p>
                </div>
                <div className="bg-[#140d14] p-3.5 rounded-xl border border-white/5">
                  <p className="text-[10px] uppercase font-mono text-white/40">Wholesale Inquiries</p>
                  <p className="text-xl font-bold text-[#D6B36A] font-mono mt-1">{selectedCustomer.rfqs?.length || 0}</p>
                </div>
              </div>

              {/* Contact Information */}
              <div className="bg-[#140d14] p-4 rounded-xl border border-white/5 space-y-2 text-xs text-white/80">
                <h4 className="font-bold text-[#D6B36A] uppercase tracking-wider text-[11px]">Customer Profile</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>Company: <span className="text-white font-semibold">{selectedCustomer.company || 'None'}</span></div>
                  <div>Phone: <span className="text-white font-semibold font-mono">{selectedCustomer.phone || 'None'}</span></div>
                  <div>WhatsApp: <span className="text-white font-semibold font-mono">{selectedCustomer.whatsapp || 'None'}</span></div>
                  <div>Address: <span className="text-white font-semibold">{selectedCustomer.address || 'None'}, {selectedCustomer.city || ''} {selectedCustomer.country || ''}</span></div>
                </div>
              </div>

              {/* Recent Orders History */}
              <div className="space-y-2">
                <h4 className="font-bold text-sm text-white">Order History</h4>
                {(!selectedCustomer.orders || selectedCustomer.orders.length === 0) ? (
                  <p className="text-xs text-white/40 italic">No orders logged for this customer yet.</p>
                ) : (
                  <div className="space-y-2">
                    {selectedCustomer.orders.map((ord: any) => (
                      <div key={ord.id} className="p-3 rounded-xl bg-[#140d14] border border-white/5 flex items-center justify-between text-xs">
                        <div>
                          <span className="font-bold text-[#D6B36A] font-mono">{ord.orderNumber}</span>
                          <span className="text-white/40 ml-2">{new Date(ord.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase font-mono bg-blue-500/10 text-blue-400">
                            {ord.status}
                          </span>
                          <span className="font-mono font-bold text-white">${ord.total.toFixed(2)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
