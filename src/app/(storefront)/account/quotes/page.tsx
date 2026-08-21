'use client';

import React, { useEffect, useState } from 'react';
import { FileText, Eye, Calendar, User, Globe, ChevronDown, ChevronUp } from 'lucide-react';
import Link from 'next/link';

interface RFQItem {
  id: string;
  productCode: string;
  productName: string;
  quantity: number;
  requiredSize: string | null;
  material: string | null;
  finish: string | null;
  additionalRequirements: string | null;
}

interface RFQ {
  id: string;
  rfqNumber: string;
  createdAt: string;
  status: string;
  company: string | null;
  country: string | null;
  notes: string | null;
  items: RFQItem[];
}

export default function QuotesHistoryPage() {
  const [quotes, setQuotes] = useState<RFQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedQuoteId, setExpandedQuoteId] = useState<string | null>(null);

  const fetchQuotes = async () => {
    try {
      const res = await fetch('/api/rfq');
      if (res.ok) {
        const data = await res.json();
        setQuotes(data.rfqs);
      }
    } catch (e) {
      console.error('Fetch RFQs error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotes();
  }, []);

  const toggleExpandQuote = (id: string) => {
    setExpandedQuoteId(prev => (prev === id ? null : id));
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'QUOTED': return 'bg-green-500/10 text-green-400 border border-green-500/20';
      case 'ACCEPTED': return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      case 'REJECTED': return 'bg-red-500/10 text-red-400 border border-red-500/20';
      case 'NEW': return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
      case 'PROCESSING': return 'bg-[#D6B36A]/10 text-[#D6B36A] border border-[#D6B36A]/20';
      default: return 'bg-white/10 text-white/50 border border-white/10';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <span className="text-xs text-white/50">Fetching quotes history...</span>
      </div>
    );
  }

  return (
    <div className="bg-[#1c141c] border border-white/5 p-8 rounded-2xl space-y-6">
      <div>
        <h2 className="text-xl font-bold">B2B Wholesale Quotation Inquiries</h2>
        <p className="text-xs text-white/40 mt-1">Review status updates and customized configurations for your bulk quotation requests.</p>
      </div>

      {quotes.length === 0 ? (
        <div className="text-center py-16 bg-[#171017] rounded-xl border border-white/5 space-y-4">
          <FileText size={32} className="mx-auto text-white/20" />
          <p className="text-xs text-white/40">You haven't submitted any bulk quote requests yet.</p>
          <Link 
            href="/quote" 
            className="inline-block bg-[#C21875] text-white font-bold text-xs uppercase tracking-wider px-6 py-2.5 rounded-full"
          >
            Create Quote Request
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {quotes.map((rfq) => {
            const isExpanded = expandedQuoteId === rfq.id;
            const quoteDate = new Date(rfq.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            });

            return (
              <div key={rfq.id} className="bg-[#171017] border border-white/5 rounded-xl overflow-hidden">
                
                {/* Quote Summary Row */}
                <div 
                  onClick={() => toggleExpandQuote(rfq.id)}
                  className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-white/2 transition-colors"
                >
                  <div className="space-y-1">
                    <p className="text-xs font-bold font-mono text-[#D6B36A]">{rfq.rfqNumber}</p>
                    <p className="text-[10px] text-white/40 flex items-center space-x-1">
                      <Calendar size={11} />
                      <span>{quoteDate}</span>
                    </p>
                  </div>

                  <div className="flex items-center space-x-3 text-[10px] uppercase font-semibold">
                    <span className="flex items-center space-x-1 text-white/60">
                      <Globe size={12} className="text-[#C21875]" />
                      <span>{rfq.country || 'Global'}</span>
                    </span>
                    {rfq.company && (
                      <span className="text-white/40 text-[9px] px-2 py-0.5 bg-white/5 rounded">
                        {rfq.company}
                      </span>
                    )}
                  </div>

                  <div className="text-right flex items-center space-x-4">
                    <div>
                      <p className="text-[10px] text-white/40 uppercase font-mono tracking-wider block">RFQ Status</p>
                      <span className={`inline-block mt-0.5 px-2.5 py-0.5 rounded-full text-[9px] font-bold tracking-wider ${getStatusBadgeClass(rfq.status)}`}>
                        {rfq.status}
                      </span>
                    </div>
                    {isExpanded ? <ChevronUp size={16} className="text-white/40" /> : <ChevronDown size={16} className="text-white/40" />}
                  </div>
                </div>

                {/* Expanded Details Row */}
                {isExpanded && (
                  <div className="p-6 bg-white/2 border-t border-white/5 space-y-6 text-xs text-white/70">
                    {/* Inquiry Items List */}
                    <div className="space-y-2">
                      <p className="font-bold text-[#D6B36A] uppercase tracking-wider text-[10px] mb-2">Requested Catalog Items</p>
                      <div className="divide-y divide-white/5 border border-white/5 rounded-lg overflow-hidden bg-[#171017]">
                        {rfq.items.map((item) => (
                          <div key={item.id} className="p-4 space-y-3 hover:bg-white/2">
                            <div className="flex justify-between items-center font-bold text-white">
                              <span>{item.productName}</span>
                              <span className="font-mono text-[#D6B36A]">{item.quantity} units</span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[10px] text-white/50">
                              <p>📏 Req. Size: <span className="text-white/80 font-mono">{item.requiredSize || 'Catalog Default'}</span></p>
                              <p>🛠️ Req. Steel: <span className="text-white/80 font-mono">{item.material || 'Catalog Default'}</span></p>
                              <p>✨ Req. Finish: <span className="text-white/80 font-mono">{item.finish || 'Catalog Default'}</span></p>
                            </div>
                            {item.additionalRequirements && (
                              <p className="text-[10px] text-white/50 bg-[#1c141c] p-2 rounded">
                                🔧 OEM requests: <span className="text-white/80">{item.additionalRequirements}</span>
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Inquiry notes */}
                    {rfq.notes && (
                      <div className="pt-4 border-t border-white/5 text-[11px] leading-relaxed">
                        <p className="font-bold text-white uppercase tracking-wider mb-1">Additional Shipping / Logistics Notes</p>
                        <p className="text-white/60 bg-[#171017] p-3 rounded-lg border border-white/5">{rfq.notes}</p>
                      </div>
                    )}
                  </div>
                )}

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
