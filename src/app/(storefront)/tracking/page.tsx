'use client';

import React, { useState } from 'react';
import { Search, Truck, Calendar, DollarSign, Package } from 'lucide-react';
import Link from 'next/link';

export default function OrderTrackingPage() {
  const [orderNumber, setOrderNumber] = useState('');
  const [order, setOrder] = useState<any>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchOrder = async (num: string) => {
    if (!num) return;
    setLoading(true);
    setError('');
    setOrder(null);

    try {
      const res = await fetch(`/api/orders/track?orderNumber=${encodeURIComponent(num.toUpperCase().trim())}`);
      const data = await res.json();
      if (res.ok) {
        setOrder(data.order);
      } else {
        setError(data.error || 'Failed to locate order.');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const qNum = params.get('orderNumber');
      if (qNum) {
        setOrderNumber(qNum);
        fetchOrder(qNum);
      }
    }
  }, []);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    fetchOrder(orderNumber);
  };

  return (
    <div className="py-16 max-w-xl mx-auto px-4 text-white space-y-8">
      
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Track Your Shipment</h1>
        <p className="text-xs text-white/50">Enter your order reference code (e.g. ORD-2026-10001) to trace dispatch status.</p>
      </div>

      {/* Input Form */}
      <div className="bg-[#1c141c] border border-white/5 p-6 rounded-2xl shadow-xl">
        <form onSubmit={handleTrack} className="flex gap-2">
          <input
            type="text"
            required
            placeholder="e.g. ORD-2026-10001"
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
            className="w-full bg-[#171017] border border-white/10 text-xs px-4 py-3 rounded-full focus:outline-none focus:border-[#C21875] uppercase font-mono font-bold"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-[#C21875] hover:bg-[#A31260] text-white px-6 py-3 rounded-full text-xs font-bold uppercase tracking-wider flex items-center space-x-1 transition-colors"
          >
            <Search size={14} />
            <span>{loading ? 'Searching...' : 'Track'}</span>
          </button>
        </form>
      </div>

      {/* Error display */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/35 text-red-400 p-4 rounded-xl text-xs text-center">
          {error}
        </div>
      )}

      {/* Result Display */}
      {order && (
        <div className="bg-[#1c141c] border border-white/5 p-8 rounded-2xl space-y-6 shadow-2xl text-xs">
          
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <div>
              <p className="font-mono font-bold text-sm text-[#D6B36A]">{order.orderNumber}</p>
              <p className="text-[10px] text-white/40 mt-0.5">Placed on {new Date(order.createdAt).toLocaleDateString()}</p>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[9px] uppercase font-bold tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20">
              {order.status}
            </span>
          </div>

          <div className="space-y-4">
            
            {/* Delivery Progress Bar */}
            <div className="relative pt-2">
              <div className="flex justify-between text-[10px] text-white/50 font-bold uppercase tracking-wider mb-2">
                <span>Ordered</span>
                <span>Dispatched</span>
                <span>Completed</span>
              </div>
              <div className="w-full bg-[#171017] h-2 rounded-full overflow-hidden flex">
                <div 
                  className={`h-full bg-[#C21875] transition-all duration-500 ${
                    order.status === 'PENDING' ? 'w-1/3' : 
                    order.status === 'SHIPPED' ? 'w-2/3' : 
                    order.status === 'DELIVERED' ? 'w-full' : 'w-1/2'
                  }`}
                />
              </div>
            </div>

            {/* Carrier references */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-white/5 pt-4">
              <div className="space-y-1">
                <p className="text-white/40 font-mono text-[9px] uppercase">Carrier Details</p>
                <div className="flex items-center space-x-1.5 font-semibold text-white/80">
                  <Truck size={14} className="text-[#D6B36A]" />
                  <span>
                    {order.trackingNumber ? (
                      <span className="font-mono text-[#D6B36A] font-bold">{order.trackingNumber}</span>
                    ) : (
                      <span className="text-white/30 italic">Processing Dispatch</span>
                    )}
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-white/40 font-mono text-[9px] uppercase">Order Amount</p>
                <div className="flex items-center space-x-1.5 font-bold text-white/80">
                  <span className="font-mono text-[#C21875] font-extrabold">Rs. {order.total.toFixed(0)}</span>
                </div>
              </div>
            </div>

            {/* Status explanation */}
            <p className="text-white/50 leading-relaxed bg-[#171017] p-3 rounded-lg border border-white/5 text-[10px] mt-4">
              💡 {order.status === 'PENDING' && 'We are auditing payment details and picking inventory items.'}
              {order.status === 'CONFIRMED' && 'Payment verified. Forging / packing catalog items.'}
              {order.status === 'PROCESSING' && 'Instruments undergoing ultrasonic clean and passivating acid tests.'}
              {order.status === 'SHIPPED' && `Consignment handed over to air cargo. Tracking ID is active.`}
              {order.status === 'DELIVERED' && 'DHL customs clearance completed. Package delivered to destination.'}
            </p>

          </div>

        </div>
      )}

    </div>
  );
}
