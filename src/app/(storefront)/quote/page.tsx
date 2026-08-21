'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { FileText, Trash2, ArrowRight, ArrowLeft, Send, CheckCircle2 } from 'lucide-react';

export default function QuotePage() {
  const router = useRouter();
  const { user } = useAuth();
  const { quote, updateQuoteQty, updateQuoteDetails, removeFromQuote, clearQuote } = useCart();

  // Form states
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [whatsapp, setWhatsapp] = useState(user?.whatsapp || '');
  const [company, setCompany] = useState(user?.company || '');
  const [country, setCountry] = useState(user?.country || '');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rfqSuccessNumber, setRfqSuccessNumber] = useState('');

  // Auto fill form when user state loads
  React.useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
      setPhone(user.phone || '');
      setWhatsapp(user.whatsapp || '');
      setCompany(user.company || '');
      setCountry(user.country || '');
    }
  }, [user]);

  const handleSubmitRfq = async (e: React.FormEvent) => {
    e.preventDefault();
    if (quote.length === 0) return;

    setIsSubmitting(true);
    try {
      // Map quote context items to API structure
      const rfqItems = quote.map(item => ({
        productId: item.product.id,
        productCode: item.product.productCode,
        productName: item.product.name,
        quantity: item.quantity,
        requiredSize: item.requiredSize || '',
        material: item.material || '',
        finish: item.finish || '',
        additionalRequirements: item.additionalRequirements || '',
      }));

      const res = await fetch('/api/rfq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          phone,
          whatsapp,
          company,
          country,
          notes,
          items: rfqItems,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setRfqSuccessNumber(data.rfqNumber);
        clearQuote(); // Clear local storage draft items
      } else {
        alert(data.error || 'Failed to submit quote request.');
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred during submission. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="py-12 max-w-7xl mx-auto px-4 text-white">
      <div className="flex flex-col space-y-4 mb-8">
        <div className="text-xs uppercase tracking-widest font-mono text-[#D6B36A] flex space-x-2">
          <Link href="/" className="hover:underline">Home</Link>
          <span>/</span>
          <span className="text-white/40">Request a Wholesale Quote</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Wholesale Quote Cart</h1>
        <p className="text-sm text-white/50">
          Request custom quotes, bulk price reductions, and custom branding OEM configurations.
        </p>
      </div>

      {rfqSuccessNumber ? (
        <div className="text-center py-20 bg-[#1c141c] border border-[#C21875]/30 rounded-3xl max-w-2xl mx-auto p-10 space-y-6">
          <CheckCircle2 size={64} className="mx-auto text-green-400" />
          <h2 className="text-2xl font-bold">Inquiry Submitted Successfully</h2>
          <p className="text-sm text-white/70 leading-relaxed">
            Thank you for contacting Lash Tweezers Lounge. Your inquiry has been logged in our system as tracking reference number:
          </p>
          <p className="text-xl font-bold font-mono text-[#D6B36A] bg-[#171017] py-3 px-6 rounded-lg border border-white/5 inline-block">
            {rfqSuccessNumber}
          </p>
          <p className="text-xs text-white/50 leading-relaxed">
            Our corporate accounts division is reviewing your catalog codes and requirements. We will contact you via email or WhatsApp within 12–24 business hours.
          </p>
          <div className="pt-4 flex justify-center space-x-4">
            <Link 
              href="/account/quotes"
              className="bg-[#C21875] hover:bg-[#A31260] text-white font-bold text-xs uppercase tracking-wider px-6 py-3.5 rounded-full"
            >
              Track Quote Status
            </Link>
            <Link 
              href="/"
              className="bg-transparent border border-white/20 hover:border-white text-white font-bold text-xs uppercase tracking-wider px-6 py-3.5 rounded-full"
            >
              Return Home
            </Link>
          </div>
        </div>
      ) : quote.length === 0 ? (
        <div className="text-center py-20 bg-[#1c141c] border border-white/5 rounded-3xl space-y-6">
          <FileText size={48} className="mx-auto text-white/20" />
          <h3 className="text-lg font-semibold">Your Quote Cart is empty</h3>
          <p className="text-sm text-white/40 max-w-md mx-auto">
            Browse our catalogs and click "Add to Quote Draft" or "B2B Quote" to compile multiple items for a bulk wholesale quotation.
          </p>
          <Link 
            href="/shop" 
            className="inline-block bg-[#C21875] hover:bg-[#A31260] text-xs font-bold uppercase tracking-wider px-6 py-3.5 rounded-full transition-colors"
          >
            Browse Instruments Catalog
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
          
          {/* LEFT: Quote Items List */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-[#1c141c] border border-white/5 rounded-2xl overflow-hidden">
              <div className="p-6 border-b border-white/5 bg-white/2">
                <h3 className="font-bold text-sm uppercase tracking-wider">Inquiry Line Items</h3>
              </div>
              <div className="divide-y divide-white/5">
                {quote.map((item) => {
                  const firstImg = item.product.images ? item.product.images.split(',')[0] : '';

                  return (
                    <div key={item.product.id} className="p-6 space-y-4 hover:bg-white/2 transition-colors">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center space-x-4">
                          <div className="w-14 h-14 bg-[#261c26] border border-white/5 rounded-lg flex items-center justify-center p-1.5 shrink-0">
                            {firstImg ? (
                              <img src={firstImg} alt={item.product.name} className="object-contain max-h-full max-w-full" />
                            ) : (
                              <span className="text-[10px] text-white/30 font-mono">{item.product.productCode}</span>
                            )}
                          </div>
                          <div>
                            <Link href={`/product/${item.product.slug}`} className="font-bold text-sm hover:text-[#C21875]">
                              {item.product.name}
                            </Link>
                            <p className="text-xs text-[#D6B36A] font-mono mt-0.5">{item.product.productCode} • MOQ: {item.product.moq} pcs</p>
                          </div>
                        </div>

                        {/* Quantity input */}
                        <div className="flex items-center space-x-2">
                          <label className="text-[10px] uppercase font-mono text-white/40">Qty</label>
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateQuoteQty(item.product.id, parseInt(e.target.value) || 1)}
                            className="w-16 bg-[#171017] border border-white/10 px-2 py-1 text-center font-bold text-xs rounded"
                          />
                          <button 
                            onClick={() => removeFromQuote(item.product.id)}
                            className="text-white/30 hover:text-red-400 p-1.5 rounded"
                            title="Remove item"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>

                      {/* Custom parameters dropdowns for B2B */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs border-t border-white/3">
                        <div>
                          <label className="text-[10px] uppercase font-mono text-white/40 block mb-1">Required Size</label>
                          <input
                            type="text"
                            value={item.requiredSize}
                            onChange={(e) => updateQuoteDetails(item.product.id, { requiredSize: e.target.value })}
                            className="w-full bg-[#171017] border border-white/10 px-2.5 py-1.5 rounded focus:outline-none focus:border-[#C21875]"
                            placeholder="e.g. 5.5 inches, custom"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] uppercase font-mono text-white/40 block mb-1">Material steel</label>
                          <input
                            type="text"
                            value={item.material}
                            onChange={(e) => updateQuoteDetails(item.product.id, { material: e.target.value })}
                            className="w-full bg-[#171017] border border-white/10 px-2.5 py-1.5 rounded focus:outline-none focus:border-[#C21875]"
                            placeholder="e.g. German steel, AISI 420"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] uppercase font-mono text-white/40 block mb-1">Finish type</label>
                          <input
                            type="text"
                            value={item.finish}
                            onChange={(e) => updateQuoteDetails(item.product.id, { finish: e.target.value })}
                            className="w-full bg-[#171017] border border-white/10 px-2.5 py-1.5 rounded focus:outline-none focus:border-[#C21875]"
                            placeholder="e.g. Satin, Mirror, knurled"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] uppercase font-mono text-white/40 block mb-1">Additional OEM requirements (engraving, branding, boxes)</label>
                        <input
                          type="text"
                          value={item.additionalRequirements}
                          onChange={(e) => updateQuoteDetails(item.product.id, { additionalRequirements: e.target.value })}
                          className="w-full bg-[#171017] border border-white/10 px-2.5 py-1.5 rounded focus:outline-none focus:border-[#C21875]"
                          placeholder="e.g. Laser engraving brand logo, blister card packaging..."
                        />
                      </div>

                    </div>
                  );
                })}
              </div>
            </div>
            
            <Link href="/shop" className="inline-flex items-center space-x-1 hover:underline text-[#D6B36A] text-xs">
              <ArrowLeft size={14} />
              <span>Add More Catalog Products to Quote</span>
            </Link>
          </div>

          {/* RIGHT: Corporate RFQ Submission Form */}
          <div>
            <form onSubmit={handleSubmitRfq} className="bg-[#1c141c] border border-white/5 p-6 rounded-2xl space-y-4">
              <h3 className="font-bold text-sm uppercase tracking-wider border-b border-white/5 pb-3">Company Details</h3>
              
              <div className="space-y-3 text-xs">
                <div className="space-y-1.5">
                  <label className="text-white/50">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-[#171017] border border-white/10 px-3 py-2 rounded focus:outline-none focus:border-[#C21875]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-white/50">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#171017] border border-white/10 px-3 py-2 rounded focus:outline-none focus:border-[#C21875]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-white/50">Company / Lash Shop Name</label>
                  <input
                    type="text"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    className="w-full bg-[#171017] border border-white/10 px-3 py-2 rounded focus:outline-none focus:border-[#C21875]"
                    placeholder="e.g. Lash Academy, Beauty Shop"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-white/50">WhatsApp Number (with country code)</label>
                  <input
                    type="text"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    className="w-full bg-[#171017] border border-white/10 px-3 py-2 rounded focus:outline-none focus:border-[#C21875]"
                    placeholder="e.g. +923348012580"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-white/50">Phone Number</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-[#171017] border border-white/10 px-3 py-2 rounded focus:outline-none focus:border-[#C21875]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-white/50">Target Destination Country *</label>
                  <input
                    type="text"
                    required
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full bg-[#171017] border border-white/10 px-3 py-2 rounded focus:outline-none focus:border-[#C21875]"
                    placeholder="e.g. United Kingdom, Germany"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-white/50">Additional Shipping / Logistics Notes</label>
                  <textarea
                    rows={4}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full bg-[#171017] border border-white/10 px-3 py-2 rounded focus:outline-none focus:border-[#C21875]"
                    placeholder="Provide container packaging instructions, certificates required (e.g. CoO), or port of entry details..."
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#C21875] hover:bg-[#A31260] disabled:bg-white/10 text-white font-bold text-xs uppercase tracking-wider py-4.5 rounded-full flex items-center justify-center space-x-1.5 shadow-lg transition-colors mt-6"
              >
                {isSubmitting ? (
                  <span>Submitting request...</span>
                ) : (
                  <>
                    <Send size={14} />
                    <span>Submit Quote Request</span>
                  </>
                )}
              </button>
            </form>
          </div>

        </div>
      )}
    </div>
  );
}
