'use client';

import React, { useEffect, useState } from 'react';
import { ShoppingBag, Eye, Calendar, DollarSign, Truck, ChevronDown, ChevronUp } from 'lucide-react';
import Link from 'next/link';

interface OrderItem {
  id: string;
  productCode: string;
  productName: string;
  quantity: number;
  pricePerUnit: number;
  totalPrice: number;
}

interface Order {
  id: string;
  orderNumber: string;
  createdAt: string;
  subtotal: number;
  discount: number;
  shippingCost: number;
  tax: number;
  total: number;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  shippingAddress: string;
  trackingNumber: string | null;
  notes: string | null;
  items: OrderItem[];
}

export default function OrdersHistoryPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/orders');
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders);
      }
    } catch (e) {
      console.error('Fetch orders error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const toggleExpandOrder = (id: string) => {
    setExpandedOrderId(prev => (prev === id ? null : id));
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'DELIVERED': return 'bg-green-500/10 text-green-400 border border-green-500/20';
      case 'CANCELLED': return 'bg-red-500/10 text-red-400 border border-red-500/20';
      case 'PENDING': return 'bg-[#D6B36A]/10 text-[#D6B36A] border border-[#D6B36A]/20';
      default: return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <span className="text-xs text-white/50">Fetching orders...</span>
      </div>
    );
  }

  return (
    <div className="bg-[#1c141c] border border-white/5 p-8 rounded-2xl space-y-6">
      <div>
        <h2 className="text-xl font-bold">Purchase History</h2>
        <p className="text-xs text-white/40 mt-1">Review the details and shipping tracking status of your storefront purchases.</p>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-16 bg-[#171017] rounded-xl border border-white/5 space-y-4">
          <ShoppingBag size={32} className="mx-auto text-white/20" />
          <p className="text-xs text-white/40">You haven't placed any orders yet.</p>
          <Link 
            href="/shop" 
            className="inline-block bg-[#C21875] text-white font-bold text-xs uppercase tracking-wider px-6 py-2.5 rounded-full"
          >
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const isExpanded = expandedOrderId === order.id;
            const orderDate = new Date(order.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            });

            return (
              <div key={order.id} className="bg-[#171017] border border-white/5 rounded-xl overflow-hidden">
                
                {/* Order Summary Row */}
                <div 
                  onClick={() => toggleExpandOrder(order.id)}
                  className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-white/2 transition-colors"
                >
                  <div className="space-y-1">
                    <p className="text-xs font-bold font-mono text-[#D6B36A]">{order.orderNumber}</p>
                    <p className="text-[10px] text-white/40 flex items-center space-x-1">
                      <Calendar size={11} />
                      <span>{orderDate}</span>
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-[10px] uppercase tracking-wider font-semibold">
                    <span className={`px-2.5 py-0.5 rounded-full ${getStatusBadgeClass(order.status)}`}>
                      {order.status}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full ${
                      order.paymentStatus === 'PAID' 
                        ? 'bg-green-500/10 text-green-400 border border-green-500/20' 
                        : 'bg-red-500/10 text-red-400 border border-red-500/20'
                    }`}>
                      {order.paymentStatus}
                    </span>
                  </div>

                  <div className="text-right flex items-center space-x-4">
                    <div>
                      <p className="text-[10px] text-white/40 uppercase font-mono tracking-wider">Total Value</p>
                      <p className="text-sm font-bold text-[#C21875] font-mono">Rs. {order.total.toFixed(0)}</p>
                    </div>
                    {isExpanded ? <ChevronUp size={16} className="text-white/40" /> : <ChevronDown size={16} className="text-white/40" />}
                  </div>
                </div>

                {/* Expanded Details Row */}
                {isExpanded && (
                  <div className="p-6 bg-white/2 border-t border-white/5 space-y-6 text-xs text-white/70">
                    {/* Items table */}
                    <div className="space-y-2">
                      <p className="font-bold text-[#D6B36A] uppercase tracking-wider text-[10px] mb-2">Order Line Items</p>
                      <div className="divide-y divide-white/5 border border-white/5 rounded-lg overflow-hidden bg-[#171017]">
                        {order.items.map((item) => (
                          <div key={item.id} className="p-4 flex justify-between items-center hover:bg-white/2">
                            <div>
                              <p className="font-bold text-white">{item.productName}</p>
                              <p className="text-white/40 font-mono mt-0.5">{item.productCode} • {item.quantity} units</p>
                            </div>
                            <span className="font-semibold text-white/80 font-mono">Rs. {item.totalPrice.toFixed(0)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Shipping logistics info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-white/5 text-[11px] leading-relaxed">
                      <div>
                        <p className="font-bold text-white uppercase tracking-wider mb-2">Shipping Information</p>
                        {(() => {
                          try {
                            const addr = JSON.parse(order.shippingAddress);
                            return (
                              <p className="text-white/60">
                                {addr.address}<br />
                                {addr.city}, {addr.zipCode}<br />
                                {addr.country}
                              </p>
                            );
                          } catch (e) {
                            return <p className="text-white/60">{order.shippingAddress}</p>;
                          }
                        })()}
                      </div>
                      <div>
                        <p className="font-bold text-white uppercase tracking-wider mb-2">Payment & Shipment</p>
                        <ul className="space-y-1 text-white/60">
                          <li>Payment Route: {order.paymentMethod === 'CARD' ? 'Credit / Debit Card' : 'Proforma Invoice / Bank Wire'}</li>
                          <li>Payment Status: <span className="font-bold">{order.paymentStatus}</span></li>
                          <li className="flex items-center space-x-1.5 mt-1.5">
                            <Truck size={13} className="text-[#D6B36A]" />
                            <span>Logistics: </span>
                            {order.trackingNumber ? (
                              <span className="font-bold text-[#D6B36A] font-mono">{order.trackingNumber}</span>
                            ) : (
                              <span className="text-white/30 italic">Not Shipped Yet</span>
                            )}
                          </li>
                        </ul>
                      </div>
                    </div>
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
