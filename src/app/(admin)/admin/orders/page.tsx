'use client';

import React, { useEffect, useState } from 'react';
import { 
  ShoppingCart, Eye, Truck, Calendar, RefreshCcw, 
  Search, Filter, Trash2, Check, X, Loader2, DollarSign,
  User, MapPin, Printer, ExternalLink, Zap
} from 'lucide-react';
import { useRealtime } from '@/context/RealtimeContext';

interface OrderItem {
  id: string;
  productName: string;
  productCode: string;
  quantity: number;
  pricePerUnit: number;
  totalPrice: number;
}

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
  companyName?: string | null;
  shippingAddress: string;
  subtotal: number;
  discount: number;
  shippingCost: number;
  tax: number;
  total: number;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  trackingNumber?: string | null;
  notes?: string | null;
  items: OrderItem[];
  createdAt: string;
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Status edit states inside modal
  const [status, setStatus] = useState('PENDING');
  const [paymentStatus, setPaymentStatus] = useState('UNPAID');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/admin/orders', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Real-time live auto-refresh on order updates
  useRealtime(['ORDER_CREATED', 'ORDER_UPDATED', 'ORDER_DELETED'], () => {
    fetchOrders();
  });

  // Quick inline real-time status changer
  const handleQuickStatusChange = async (orderId: string, newStatus: string) => {
    setUpdatingOrderId(orderId);
    // Optimistic UI update
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));

    try {
      await fetch('/api/admin/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status: newStatus })
      });
    } catch (e) {
      console.error('Quick status update error:', e);
      fetchOrders();
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleOpenDetailModal = (order: Order) => {
    setSelectedOrder(order);
    setStatus(order.status);
    setPaymentStatus(order.paymentStatus);
    setTrackingNumber(order.trackingNumber || '');
    setNotes(order.notes || '');
  };

  const handleUpdateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    setIsSaving(true);

    try {
      const res = await fetch('/api/admin/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: selectedOrder.id,
          status,
          paymentStatus,
          trackingNumber,
          notes
        })
      });

      const data = await res.json();
      if (res.ok) {
        setSelectedOrder(data.order);
        await fetchOrders();
      } else {
        alert(data.error || 'Failed to update order');
      }
    } catch (err) {
      console.error(err);
      alert('Error updating order');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteOrder = async (id: string) => {
    if (!confirm('Are you sure you want to delete this order record?')) return;
    try {
      await fetch(`/api/admin/orders?id=${id}`, { method: 'DELETE' });
      if (selectedOrder?.id === id) setSelectedOrder(null);
      fetchOrders();
    } catch (e) {
      console.error('Delete order error:', e);
    }
  };

  const filtered = orders.filter(o => {
    const matchesSearch = !search || 
      o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      o.customerName.toLowerCase().includes(search.toLowerCase()) ||
      o.customerEmail.toLowerCase().includes(search.toLowerCase()) ||
      (o.customerPhone && o.customerPhone.includes(search));

    const matchesStatus = statusFilter === 'ALL' || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      
      {/* 1. Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-white">Customer Orders</h1>
            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono font-bold uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Live Real-Time Feed</span>
            </span>
          </div>
          <p className="text-xs text-white/50 mt-1">
            Process shipments, update fulfillment workflows, view items, and assign carrier tracking numbers.
          </p>
        </div>
        <button 
          onClick={() => { setLoading(true); fetchOrders(); }}
          className="bg-white/5 hover:bg-white/10 text-white/70 hover:text-white px-3 py-2 rounded-xl text-xs font-bold transition-colors flex items-center space-x-1.5 cursor-pointer"
        >
          <RefreshCcw size={14} />
          <span>Refresh Orders</span>
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
              placeholder="Search by order #, customer name, email, phone..."
              className="w-full bg-[#120a12] border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#C21875]"
            />
          </div>

          <span className="text-xs text-white/50 font-mono">
            {filtered.length} of {orders.length} Orders
          </span>
        </div>

        {/* Status Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          {['ALL', 'PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'RETURNED'].map(st => (
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

      {/* 3. Orders Table */}
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
                  <th className="py-3 px-4">Order Ref</th>
                  <th className="py-3 px-3">Customer Details</th>
                  <th className="py-3 px-3">Items Count</th>
                  <th className="py-3 px-3 text-center">Fulfillment Status</th>
                  <th className="py-3 px-3 text-center">Payment</th>
                  <th className="py-3 px-3 text-right">Total Amount</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-white/40 italic">
                      No orders found matching the filter.
                    </td>
                  </tr>
                ) : (
                  filtered.map((ord) => (
                    <tr key={ord.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-bold text-[#D6B36A] font-mono block text-xs">{ord.orderNumber}</span>
                        <span className="text-[10px] text-white/40">{new Date(ord.createdAt).toLocaleDateString()}</span>
                      </td>

                      <td className="py-3 px-3">
                        <span className="font-bold text-white block">{ord.customerName}</span>
                        <span className="text-[10px] text-white/40 truncate max-w-[160px] block">{ord.customerEmail}</span>
                      </td>

                      <td className="py-3 px-3">
                        <span className="text-white/80 font-mono">{ord.items?.length || 0} product(s)</span>
                      </td>

                      <td className="py-3 px-3 text-center">
                        <select
                          value={ord.status}
                          disabled={updatingOrderId === ord.id}
                          onChange={(e) => handleQuickStatusChange(ord.id, e.target.value)}
                          className={`text-[10px] font-bold uppercase font-mono px-2 py-1 rounded-lg border bg-[#140d14] cursor-pointer focus:outline-none transition-colors ${
                            ord.status === 'DELIVERED' ? 'text-emerald-400 border-emerald-500/30' :
                            ord.status === 'PENDING' ? 'text-amber-400 border-amber-500/30' :
                            ord.status === 'SHIPPED' ? 'text-purple-400 border-purple-500/30' :
                            ord.status === 'CANCELLED' ? 'text-red-400 border-red-500/30' :
                            'text-blue-400 border-blue-500/30'
                          }`}
                        >
                          <option value="PENDING" className="bg-[#191019] text-white">PENDING</option>
                          <option value="CONFIRMED" className="bg-[#191019] text-white">CONFIRMED</option>
                          <option value="PROCESSING" className="bg-[#191019] text-white">PROCESSING</option>
                          <option value="SHIPPED" className="bg-[#191019] text-white">SHIPPED</option>
                          <option value="DELIVERED" className="bg-[#191019] text-white">DELIVERED</option>
                          <option value="CANCELLED" className="bg-[#191019] text-white">CANCELLED</option>
                          <option value="RETURNED" className="bg-[#191019] text-white">RETURNED</option>
                        </select>
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase font-mono ${
                          ord.paymentStatus === 'PAID' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                        }`}>
                          {ord.paymentStatus}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right">
                        <span className="font-mono font-bold text-white text-sm">${ord.total.toFixed(2)}</span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            onClick={() => handleOpenDetailModal(ord)}
                            className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-[#C21875] text-white text-xs font-bold transition-all"
                          >
                            Manage
                          </button>
                          <button
                            onClick={() => handleDeleteOrder(ord.id)}
                            className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400"
                            title="Delete order"
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

      {/* 4. ORDER DETAIL / INVOICE MODAL */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#191019] border border-white/10 w-full max-w-3xl max-h-[90vh] rounded-3xl overflow-hidden shadow-2xl flex flex-col">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-[#140d14]">
              <div>
                <h3 className="text-sm font-bold text-white">Order Details: {selectedOrder.orderNumber}</h3>
                <span className="text-[10px] text-white/40">{new Date(selectedOrder.createdAt).toLocaleString()}</span>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="text-white/60 hover:text-white"><X size={18} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Status Update Form */}
              <form onSubmit={handleUpdateOrder} className="bg-[#140d14] p-4 rounded-2xl border border-white/5 space-y-4">
                <h4 className="font-bold text-xs uppercase text-[#D6B36A] tracking-wider">Update Order Status</h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-white/70 block mb-1">Fulfillment Status</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="w-full bg-[#120a12] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-[#C21875] focus:outline-none"
                    >
                      <option value="PENDING">PENDING</option>
                      <option value="CONFIRMED">CONFIRMED</option>
                      <option value="PROCESSING">PROCESSING</option>
                      <option value="SHIPPED">SHIPPED</option>
                      <option value="DELIVERED">DELIVERED</option>
                      <option value="CANCELLED">CANCELLED</option>
                      <option value="RETURNED">RETURNED</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-white/70 block mb-1">Payment Status</label>
                    <select
                      value={paymentStatus}
                      onChange={(e) => setPaymentStatus(e.target.value)}
                      className="w-full bg-[#120a12] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-[#C21875] focus:outline-none"
                    >
                      <option value="UNPAID">UNPAID</option>
                      <option value="PAID">PAID</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-white/70 block mb-1">Tracking Number</label>
                    <input
                      type="text"
                      value={trackingNumber}
                      onChange={(e) => setTrackingNumber(e.target.value)}
                      placeholder="DHL / FedEx / TCS #"
                      className="w-full bg-[#120a12] border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-[#C21875] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-[11px] text-white/40">Payment Method: <strong className="text-white">{selectedOrder.paymentMethod}</strong></span>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider text-white bg-[#C21875] hover:bg-[#A31260] transition-colors flex items-center space-x-1"
                  >
                    {isSaving && <Loader2 size={12} className="animate-spin" />}
                    <span>Update Order</span>
                  </button>
                </div>
              </form>

              {/* Customer & Shipping Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-[#140d14] p-4 rounded-2xl border border-white/5 space-y-1.5 text-xs text-white/80">
                  <h4 className="font-bold text-[#D6B36A] uppercase tracking-wider text-[11px] mb-2">Customer Info</h4>
                  <p>Name: <strong className="text-white">{selectedOrder.customerName}</strong></p>
                  <p>Email: <span className="text-white/60">{selectedOrder.customerEmail}</span></p>
                  <p>Phone: <span className="text-white/60 font-mono">{selectedOrder.customerPhone || 'N/A'}</span></p>
                  {selectedOrder.companyName && <p>Company: <span className="text-white/60">{selectedOrder.companyName}</span></p>}
                </div>

                <div className="bg-[#140d14] p-4 rounded-2xl border border-white/5 space-y-1.5 text-xs text-white/80">
                  <h4 className="font-bold text-[#D6B36A] uppercase tracking-wider text-[11px] mb-2">Shipping Destination</h4>
                  <p className="whitespace-pre-line text-white/60 leading-relaxed font-mono">
                    {(() => {
                      try {
                        const parsed = JSON.parse(selectedOrder.shippingAddress);
                        return typeof parsed === 'object' ? Object.values(parsed).filter(Boolean).join('\n') : selectedOrder.shippingAddress;
                      } catch {
                        return selectedOrder.shippingAddress;
                      }
                    })()}
                  </p>
                </div>
              </div>

              {/* Order Items Table */}
              <div className="space-y-2">
                <h4 className="font-bold text-xs uppercase text-white tracking-wider">Ordered Products</h4>
                <div className="bg-[#140d14] border border-white/5 rounded-2xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-white/5 text-white/40 uppercase font-mono text-[10px]">
                        <th className="p-3">Product</th>
                        <th className="p-3 text-center">Qty</th>
                        <th className="p-3 text-right">Unit Price</th>
                        <th className="p-3 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {selectedOrder.items?.map((item) => (
                        <tr key={item.id}>
                          <td className="p-3">
                            <span className="font-bold text-white block">{item.productName}</span>
                            <span className="text-[10px] text-[#D6B36A] font-mono">{item.productCode}</span>
                          </td>
                          <td className="p-3 text-center font-mono font-bold">{item.quantity}</td>
                          <td className="p-3 text-right font-mono">${item.pricePerUnit.toFixed(2)}</td>
                          <td className="p-3 text-right font-mono font-bold text-white">${item.totalPrice.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Price Breakdown */}
                <div className="p-4 bg-[#140d14] rounded-2xl border border-white/5 space-y-1.5 text-xs text-right">
                  <p className="text-white/60">Subtotal: <span className="font-mono text-white font-bold ml-2">${selectedOrder.subtotal.toFixed(2)}</span></p>
                  <p className="text-white/60">Shipping: <span className="font-mono text-white font-bold ml-2">${selectedOrder.shippingCost.toFixed(2)}</span></p>
                  <p className="text-white/60">Tax: <span className="font-mono text-white font-bold ml-2">${selectedOrder.tax.toFixed(2)}</span></p>
                  <p className="text-sm font-bold text-[#D6B36A] pt-1 border-t border-white/5">
                    Grand Total: <span className="font-mono text-white text-base ml-2">${selectedOrder.total.toFixed(2)}</span>
                  </p>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
