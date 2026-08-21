'use client';

import React, { useEffect, useState } from 'react';
import { 
  FileText, Search, Eye, Globe, Phone, Calendar, 
  RefreshCcw, Send, MessageSquare, Trash2, Loader2, X, Check, Zap
} from 'lucide-react';
import { useRealtime } from '@/context/RealtimeContext';

interface RfqItem {
  id: string;
  productName: string;
  productCode: string;
  quantity: number;
  requiredSize?: string | null;
  material?: string | null;
  finish?: string | null;
  additionalRequirements?: string | null;
}

interface Rfq {
  id: string;
  rfqNumber: string;
  name: string;
  company?: string | null;
  email: string;
  phone?: string | null;
  whatsapp?: string | null;
  country?: string | null;
  status: string;
  notes?: string | null;
  attachmentUrl?: string | null;
  items: RfqItem[];
  createdAt: string;
}

export default function AdminRfqPage() {
  const [rfqs, setRfqs] = useState<Rfq[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedRfq, setSelectedRfq] = useState<Rfq | null>(null);

  // Form states inside modal
  const [status, setStatus] = useState('NEW');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [updatingRfqId, setUpdatingRfqId] = useState<string | null>(null);

  const fetchRfqs = async () => {
    try {
      const res = await fetch('/api/admin/rfq', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setRfqs(data.rfqs || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRfqs();
  }, []);

  // Real-time live auto-refresh on quotation updates
  useRealtime(['RFQ_CREATED', 'RFQ_UPDATED', 'RFQ_DELETED'], () => {
    fetchRfqs();
  });

  // Quick inline status updater
  const handleQuickStatusChange = async (rfqId: string, newStatus: string) => {
    setUpdatingRfqId(rfqId);
    setRfqs(prev => prev.map(r => r.id === rfqId ? { ...r, status: newStatus } : r));

    try {
      await fetch('/api/admin/rfq', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rfqId, status: newStatus })
      });
    } catch (e) {
      console.error('Quick RFQ status update error:', e);
      fetchRfqs();
    } finally {
      setUpdatingRfqId(null);
    }
  };

  const handleOpenDetailModal = (rfq: Rfq) => {
    setSelectedRfq(rfq);
    setStatus(rfq.status);
    setNotes(rfq.notes || '');
  };

  const handleUpdateRfq = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRfq) return;
    setIsSaving(true);

    try {
      const res = await fetch('/api/admin/rfq', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rfqId: selectedRfq.id,
          status,
          notes
        })
      });

      const data = await res.json();
      if (res.ok) {
        setSelectedRfq(data.rfq);
        await fetchRfqs();
      } else {
        alert(data.error || 'Failed to update RFQ');
      }
    } catch (err) {
      console.error(err);
      alert('Error updating RFQ');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteRfq = async (id: string) => {
    if (!confirm('Are you sure you want to delete this quote request?')) return;
    try {
      await fetch(`/api/admin/rfq?id=${id}`, { method: 'DELETE' });
      if (selectedRfq?.id === id) setSelectedRfq(null);
      fetchRfqs();
    } catch (e) {
      console.error('Delete error:', e);
    }
  };

  const filtered = rfqs.filter(r => {
    const matchesSearch = !search || 
      r.rfqNumber.toLowerCase().includes(search.toLowerCase()) ||
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.email.toLowerCase().includes(search.toLowerCase()) ||
      (r.company && r.company.toLowerCase().includes(search.toLowerCase())) ||
      (r.phone && r.phone.includes(search));

    const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      
      {/* 1. Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-white">Quotes & B2B Inquiries</h1>
            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono font-bold uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Live Real-Time Feed</span>
            </span>
          </div>
          <p className="text-xs text-white/50 mt-1">
            Review custom wholesale inquiries, salon sample requests, and track quotation negotiation statuses.
          </p>
        </div>
        <button 
          onClick={() => { setLoading(true); fetchRfqs(); }}
          className="bg-white/5 hover:bg-white/10 text-white/70 hover:text-white px-3 py-2 rounded-xl text-xs font-bold transition-colors flex items-center space-x-1.5 cursor-pointer"
        >
          <RefreshCcw size={14} />
          <span>Refresh</span>
        </button>
      </div>

      {/* 2. Filters & Status Tabs */}
      <div className="bg-[#191019] border border-white/5 p-4 rounded-2xl space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="w-full md:w-96 relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by RFQ #, client name, company, email..."
              className="w-full bg-[#120a12] border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#C21875]"
            />
          </div>

          <span className="text-xs text-white/50 font-mono">
            {filtered.length} of {rfqs.length} Inquiries
          </span>
        </div>

        {/* Status Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          {['ALL', 'NEW', 'CONTACTED', 'QUOTED', 'NEGOTIATING', 'WON', 'LOST', 'COMPLETED'].map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase font-mono transition-colors cursor-pointer ${
                statusFilter === st
                  ? 'bg-[#C21875] text-white shadow-sm'
                  : 'bg-white/5 text-white/60 hover:bg-white/10'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* 3. RFQs Table */}
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
                  <th className="py-3 px-4">RFQ Ref</th>
                  <th className="py-3 px-3">Client / Company</th>
                  <th className="py-3 px-3">Contact</th>
                  <th className="py-3 px-3">Requested Items</th>
                  <th className="py-3 px-3 text-center">Quote Status</th>
                  <th className="py-3 px-3 text-right">Inquiry Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-white/40 italic">
                      No quotation inquiries found matching criteria.
                    </td>
                  </tr>
                ) : (
                  filtered.map((rfq) => (
                    <tr key={rfq.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-[#D6B36A] text-xs">
                        {rfq.rfqNumber}
                      </td>

                      <td className="py-3.5 px-3">
                        <span className="font-bold text-white block">{rfq.name}</span>
                        <span className="text-[10px] text-white/40">{rfq.company || 'Private Label Buyer'}</span>
                      </td>

                      <td className="py-3.5 px-3">
                        <span className="text-white block truncate max-w-[150px]">{rfq.email}</span>
                        <span className="text-[10px] text-white/40 font-mono">{rfq.phone || rfq.whatsapp || 'N/A'}</span>
                      </td>

                      <td className="py-3.5 px-3">
                        <span className="text-white/80 font-mono">{rfq.items?.length || 0} product(s)</span>
                      </td>

                      <td className="py-3.5 px-3 text-center">
                        <select
                          value={rfq.status}
                          disabled={updatingRfqId === rfq.id}
                          onChange={(e) => handleQuickStatusChange(rfq.id, e.target.value)}
                          className={`text-[10px] font-bold uppercase font-mono px-2 py-1 rounded-lg border bg-[#140d14] cursor-pointer focus:outline-none transition-colors ${
                            rfq.status === 'NEW' ? 'text-[#C21875] border-[#C21875]/30' :
                            rfq.status === 'QUOTED' ? 'text-emerald-400 border-emerald-500/30' :
                            rfq.status === 'WON' ? 'text-purple-400 border-purple-500/30' :
                            rfq.status === 'LOST' ? 'text-red-400 border-red-500/30' :
                            'text-[#D6B36A] border-[#D6B36A]/30'
                          }`}
                        >
                          <option value="NEW" className="bg-[#191019] text-white">NEW</option>
                          <option value="CONTACTED" className="bg-[#191019] text-white">CONTACTED</option>
                          <option value="QUOTED" className="bg-[#191019] text-white">QUOTED</option>
                          <option value="NEGOTIATING" className="bg-[#191019] text-white">NEGOTIATING</option>
                          <option value="WON" className="bg-[#191019] text-white">WON</option>
                          <option value="LOST" className="bg-[#191019] text-white">LOST</option>
                          <option value="COMPLETED" className="bg-[#191019] text-white">COMPLETED</option>
                        </select>
                      </td>

                      <td className="py-3.5 px-3 text-right font-mono text-[11px] text-white/50">
                        {new Date(rfq.createdAt).toLocaleDateString()}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            onClick={() => handleOpenDetailModal(rfq)}
                            className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-[#C21875] text-white text-xs font-bold transition-all"
                          >
                            Review
                          </button>
                          <button
                            onClick={() => handleDeleteRfq(rfq.id)}
                            className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400"
                            title="Delete RFQ"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. RFQ DETAIL MODAL */}
      {selectedRfq && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#191019] border border-white/10 w-full max-w-3xl max-h-[90vh] rounded-3xl overflow-hidden shadow-2xl flex flex-col">
            
            <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-[#140d14]">
              <div>
                <h3 className="text-sm font-bold text-white">Wholesale RFQ: {selectedRfq.rfqNumber}</h3>
                <span className="text-[10px] text-white/40">{new Date(selectedRfq.createdAt).toLocaleString()}</span>
              </div>
              <button onClick={() => setSelectedRfq(null)} className="text-white/60 hover:text-white"><X size={18} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Status Update Form */}
              <form onSubmit={handleUpdateRfq} className="bg-[#140d14] p-4 rounded-2xl border border-white/5 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs uppercase text-[#D6B36A] tracking-wider">Inquiry Status & Internal Notes</h4>
                  {selectedRfq.whatsapp && (
                    <a
                      href={`https://wa.me/${selectedRfq.whatsapp.replace(/[^0-9]/g, '')}?text=Hello%20${encodeURIComponent(selectedRfq.name)},%20regarding%20your%20inquiry%20${selectedRfq.rfqNumber}%20at%20Lash%20Tweezers%20Lounge...`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1 bg-[#25D366] text-black font-bold text-xs rounded-lg flex items-center space-x-1 hover:brightness-110"
                    >
                      <MessageSquare size={13} />
                      <span>WhatsApp Client</span>
                    </a>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-white/70 block mb-1">Status Workflow</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="w-full bg-[#120a12] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-[#C21875] focus:outline-none"
                    >
                      <option value="NEW">NEW</option>
                      <option value="CONTACTED">CONTACTED</option>
                      <option value="QUOTED">QUOTED</option>
                      <option value="NEGOTIATING">NEGOTIATING</option>
                      <option value="WON">WON</option>
                      <option value="LOST">LOST</option>
                      <option value="COMPLETED">COMPLETED</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-white/70 block mb-1">Internal Team Notes</label>
                    <input
                      type="text"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="e.g. Quoted $4.20/pc for 200pcs custom laser engraved"
                      className="w-full bg-[#120a12] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-[#C21875] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider text-white bg-[#C21875] hover:bg-[#A31260]"
                  >
                    {isSaving ? 'Saving...' : 'Update Status'}
                  </button>
                </div>
              </form>

              {/* Client Info */}
              <div className="bg-[#140d14] p-4 rounded-2xl border border-white/5 space-y-1 text-xs text-white/80">
                <h4 className="font-bold text-[#D6B36A] uppercase tracking-wider text-[11px] mb-2">Client Details</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div>Name: <strong className="text-white">{selectedRfq.name}</strong></div>
                  <div>Company: <span className="text-white font-semibold">{selectedRfq.company || 'N/A'}</span></div>
                  <div>Email: <a href={`mailto:${selectedRfq.email}`} className="text-[#C21875] underline">{selectedRfq.email}</a></div>
                  <div>Phone / WhatsApp: <span className="text-white font-mono">{selectedRfq.phone || selectedRfq.whatsapp || 'N/A'}</span></div>
                  <div>Country: <span className="text-white">{selectedRfq.country || 'International'}</span></div>
                </div>
              </div>

              {/* Items Table */}
              <div className="space-y-2">
                <h4 className="font-bold text-xs uppercase text-white tracking-wider">Inquired Products</h4>
                <div className="bg-[#140d14] border border-white/5 rounded-2xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-white/5 text-white/40 uppercase font-mono text-[10px]">
                        <th className="p-3">Product Name & Code</th>
                        <th className="p-3 text-center">Requested Qty</th>
                        <th className="p-3">Material / Finish</th>
                        <th className="p-3">Special Instructions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {selectedRfq.items?.map((item) => (
                        <tr key={item.id}>
                          <td className="p-3">
                            <span className="font-bold text-white block">{item.productName}</span>
                            <span className="text-[10px] text-[#D6B36A] font-mono">{item.productCode}</span>
                          </td>
                          <td className="p-3 text-center font-mono font-bold text-white">{item.quantity} pcs</td>
                          <td className="p-3 text-white/70">{item.material || item.finish || 'Standard Alloy'}</td>
                          <td className="p-3 text-white/50">{item.additionalRequirements || 'Standard Catalog OEM'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
