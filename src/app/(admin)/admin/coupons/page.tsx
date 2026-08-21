'use client';

import React, { useEffect, useState } from 'react';
import { Tag, Plus, Trash2, Edit, RefreshCcw, X } from 'lucide-react';

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<any | null>(null);

  // Form states
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState('PERCENTAGE');
  const [value, setValue] = useState('10');
  const [minOrderValue, setMinOrderValue] = useState('0');
  const [usageLimit, setUsageLimit] = useState('');
  const [status, setStatus] = useState('ACTIVE');
  const [isSaving, setIsSaving] = useState(false);

  const fetchCoupons = async () => {
    try {
      const res = await fetch('/api/admin/coupons');
      if (res.ok) {
        const data = await res.json();
        setCoupons(data.coupons);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleOpenAddModal = () => {
    setEditingCoupon(null);
    setCode('');
    setDiscountType('PERCENTAGE');
    setValue('10');
    setMinOrderValue('0');
    setUsageLimit('');
    setStatus('ACTIVE');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (coupon: any) => {
    setEditingCoupon(coupon);
    setCode(coupon.code);
    setDiscountType(coupon.discountType);
    setValue(coupon.value.toString());
    setMinOrderValue(coupon.minOrderValue.toString());
    setUsageLimit(coupon.usageLimit ? coupon.usageLimit.toString() : '');
    setStatus(coupon.status);
    setIsModalOpen(true);
  };

  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || value === undefined) return;
    setIsSaving(true);

    const payload = {
      id: editingCoupon?.id,
      code,
      discountType,
      value,
      minOrderValue,
      usageLimit: usageLimit ? parseInt(usageLimit, 10) : null,
      status
    };

    try {
      const method = editingCoupon ? 'PUT' : 'POST';
      const res = await fetch('/api/admin/coupons', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok) {
        setIsModalOpen(false);
        await fetchCoupons();
        alert(editingCoupon ? 'Coupon updated' : 'Coupon created');
      } else {
        alert(data.error || 'Failed to save coupon');
      }
    } catch (err) {
      console.error(err);
      alert('Error saving coupon');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCoupon = async (id: string, code: string) => {
    if (!confirm(`Are you sure you want to delete coupon "${code}"?`)) return;
    setLoading(true);

    try {
      const res = await fetch(`/api/admin/coupons?couponId=${id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchCoupons();
        alert('Coupon deleted successfully');
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete coupon');
      }
    } catch (err) {
      console.error(err);
      alert('Error deleting coupon');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 text-xs text-white/85">
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white font-sans">Discount Coupons</h1>
          <p className="text-xs text-white/40 mt-1">Configure promotional discount coupon codes for storefront checkout.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleOpenAddModal}
            className="bg-[#C21875] hover:bg-[#A31260] text-white px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5 transition-colors shadow-lg"
          >
            <Plus size={14} />
            <span>Add Coupon</span>
          </button>
          <button 
            onClick={() => { setLoading(true); fetchCoupons(); }}
            className="text-white/40 hover:text-white p-2.5 bg-white/5 rounded border border-white/5"
          >
            <RefreshCcw size={14} />
          </button>
        </div>
      </div>

      {/* Coupons Table */}
      <div className="bg-[#1c141c] border border-white/5 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 text-white/40 uppercase font-mono tracking-wider bg-white/2">
                <th className="p-4 font-semibold">Code</th>
                <th className="p-4 font-semibold">Discount Type</th>
                <th className="p-4 font-semibold text-center">Value</th>
                <th className="p-4 font-semibold text-center">Min Order Subtotal</th>
                <th className="p-4 font-semibold text-center">Usage Count / Limit</th>
                <th className="p-4 font-semibold text-center">Status</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {coupons.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-white/30 italic">No coupons configured.</td>
                </tr>
              ) : (
                coupons.map((c) => (
                  <tr key={c.id} className="hover:bg-white/1 transition-colors">
                    <td className="p-4 font-mono font-bold text-[#D6B36A]">{c.code}</td>
                    <td className="p-4 uppercase">{c.discountType}</td>
                    <td className="p-4 text-center font-mono font-bold text-white">
                      {c.discountType === 'PERCENTAGE' ? `${c.value}%` : `$${c.value.toFixed(2)}`}
                    </td>
                    <td className="p-4 text-center font-mono">${c.minOrderValue.toFixed(2)}</td>
                    <td className="p-4 text-center font-mono text-white/60">
                      {c.usageCount} / {c.usageLimit || '∞'}
                    </td>
                    <td className="p-4 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] uppercase font-bold tracking-wider ${
                        c.status === 'ACTIVE' 
                          ? 'bg-green-500/10 text-green-400 border border-green-500/20' 
                          : 'bg-white/5 text-white/30 border border-white/10'
                      }`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => handleOpenEditModal(c)}
                          className="p-2 bg-white/5 hover:bg-[#C21875]/20 text-[#D6B36A] hover:text-white rounded transition-colors"
                        >
                          <Edit size={12} />
                        </button>
                        <button
                          onClick={() => handleDeleteCoupon(c.id, c.code)}
                          className="p-2 bg-white/5 hover:bg-red-500/20 text-red-400 hover:text-white rounded transition-colors"
                        >
                          <Trash2 size={12} />
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

      {/* ADD/EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#171017]/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#1c141c] border border-[#C21875]/35 rounded-3xl max-w-md w-full shadow-2xl p-8 relative space-y-6">
            
            <div className="flex justify-between items-center border-b border-white/5 pb-4">
              <h3 className="font-bold text-sm text-white">
                {editingCoupon ? `Edit Coupon (${editingCoupon.code})` : 'Create Coupon Code'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-white/40 hover:text-white p-1 rounded-full bg-white/5"
              >
                <X size={14} />
              </button>
            </div>

            <form onSubmit={handleSaveCoupon} className="space-y-4 text-xs text-white/80">
              
              <div className="space-y-1.5">
                <label className="text-white/50">Coupon Code *</label>
                <input
                  type="text" required
                  value={code} onChange={(e) => setCode(e.target.value)}
                  placeholder="e.g. SUMMER15"
                  className="w-full bg-[#171017] border border-white/10 px-3 py-2 rounded focus:outline-none focus:border-[#C21875] uppercase"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-white/50">Discount Type</label>
                  <select
                    value={discountType} onChange={(e) => setDiscountType(e.target.value)}
                    className="w-full bg-[#171017] border border-white/10 px-3 py-2 rounded focus:outline-none focus:border-[#C21875] text-white"
                  >
                    <option value="PERCENTAGE" className="bg-[#1c141c] text-white">PERCENTAGE</option>
                    <option value="FIXED" className="bg-[#1c141c] text-white">FIXED VALUE</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-white/50">Discount Value *</label>
                  <input
                    type="number" required
                    value={value} onChange={(e) => setValue(e.target.value)}
                    className="w-full bg-[#171017] border border-white/10 px-3 py-2 rounded focus:outline-none focus:border-[#C21875]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-white/50">Min Cart Subtotal (USD)</label>
                  <input
                    type="number"
                    value={minOrderValue} onChange={(e) => setMinOrderValue(e.target.value)}
                    className="w-full bg-[#171017] border border-white/10 px-3 py-2 rounded focus:outline-none focus:border-[#C21875]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-white/50">Total Usage Limit</label>
                  <input
                    type="number"
                    value={usageLimit} onChange={(e) => setUsageLimit(e.target.value)}
                    placeholder="Leave empty for infinite"
                    className="w-full bg-[#171017] border border-white/10 px-3 py-2 rounded focus:outline-none focus:border-[#C21875]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-white/50">Coupon Status</label>
                <select
                  value={status} onChange={(e) => setStatus(e.target.value)}
                  className="w-full bg-[#171017] border border-white/10 px-3 py-2 rounded focus:outline-none focus:border-[#C21875] text-white"
                >
                  <option value="ACTIVE" className="bg-[#1c141c] text-white">ACTIVE</option>
                  <option value="EXPIRED" className="bg-[#1c141c] text-white">EXPIRED</option>
                </select>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <button
                  type="button" onClick={() => setIsModalOpen(false)}
                  className="bg-transparent border border-white/20 px-4 py-2 rounded-full uppercase font-bold text-[10px]"
                >
                  Cancel
                </button>
                <button
                  type="submit" disabled={isSaving}
                  className="bg-[#C21875] text-white px-6 py-2 rounded-full uppercase font-bold text-[10px] shadow"
                >
                  {isSaving ? 'Saving...' : 'Save Coupon'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
