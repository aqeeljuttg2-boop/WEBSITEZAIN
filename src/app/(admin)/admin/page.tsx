'use client';

import React, { useEffect, useState } from 'react';
import { 
  DollarSign, ShoppingCart, FileText, Users, Box, AlertTriangle, 
  ArrowUpRight, Clock, Award, Star, Loader2, RefreshCcw,
  Layers, BookmarkCheck, MessageSquare, Plus, ArrowRight,
  TrendingUp, CheckCircle, PackageCheck, Eye, Zap
} from 'lucide-react';
import Link from 'next/link';
import { useRealtime } from '@/context/RealtimeContext';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  desc: string;
  colorClass: string;
  badge?: string;
  href?: string;
}

function StatCard({ title, value, icon, desc, colorClass, badge, href }: StatCardProps) {
  const content = (
    <div className="bg-[#191019] border border-white/5 p-5 rounded-2xl flex items-center justify-between hover:border-[#C21875]/40 transition-all group">
      <div className="space-y-1.5">
        <div className="flex items-center space-x-2">
          <p className="text-[11px] uppercase font-mono font-bold tracking-wider text-white/50">{title}</p>
          {badge && (
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/10 text-[#D6B36A] font-bold font-mono">
              {badge}
            </span>
          )}
        </div>
        <h3 className="text-2xl lg:text-3xl font-black text-white font-mono tracking-tight group-hover:text-[#C21875] transition-colors">
          {value}
        </h3>
        <p className="text-[11px] text-white/40">{desc}</p>
      </div>
      <div className={`p-3.5 rounded-xl ${colorClass} shrink-0`}>
        {icon}
      </div>
    </div>
  );

  return href ? <Link href={href} className="block">{content}</Link> : content;
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    try {
      const res = await fetch('/api/admin/analytics', { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  // Live real-time auto-refresh on any data mutation
  useRealtime('ALL', () => {
    fetchAnalytics();
  });

  if (loading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center text-white space-y-3">
        <Loader2 size={36} className="animate-spin text-[#C21875]" />
        <span className="font-mono font-semibold text-xs tracking-wider uppercase text-white/60">Loading CMS Overview...</span>
      </div>
    );
  }

  const summary = data?.summary || {
    revenue: 0,
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    processingOrders: 0,
    shippedOrders: 0,
    totalRFQs: 0,
    newRFQs: 0,
    quotedRFQs: 0,
    totalCustomers: 0,
    totalProducts: 0,
    activeProducts: 0,
    lowStockProducts: 0,
    outOfStockProducts: 0,
    totalCategories: 0,
    totalSubcategories: 0,
    totalBrands: 0,
    totalReviews: 0,
    pendingReviews: 0,
    conversionRate: '0.0'
  };

  const topCategories = data?.topCategories || [];
  const recentOrders = data?.recentOrders || [];
  const recentRFQs = data?.recentRFQs || [];
  const recentProducts = data?.recentProducts || [];
  const recentCustomers = data?.recentCustomers || [];
  const monthlySales = data?.monthlySales || [];

  const maxSales = monthlySales.length > 0 ? Math.max(...monthlySales.map((m: any) => m.value), 100) : 100;

  return (
    <div className="space-y-8">
      
      {/* 1. Header Banner & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-[#1c121c] via-[#211421] to-[#170e17] p-6 rounded-2xl border border-white/5">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-white">Administrative Overview</h1>
          </div>
          <p className="text-xs text-white/50 mt-1">
            Real-time management for catalog products, customer orders, wholesale inquiries, and CMS design.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/admin/products"
            className="bg-[#C21875] hover:bg-[#A31260] text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5 shadow-lg shadow-[#C21875]/25 transition-all"
          >
            <Plus size={14} />
            <span>Add Product</span>
          </Link>
          <Link
            href="/admin/homepage"
            className="bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5 border border-white/10 transition-colors"
          >
            <span>Edit Homepage</span>
          </Link>
          <button 
            onClick={() => { setLoading(true); fetchAnalytics(); }}
            className="bg-white/5 hover:bg-white/10 text-white/70 hover:text-white p-2 rounded-xl border border-white/10 transition-colors"
            title="Refresh statistics"
          >
            <RefreshCcw size={14} />
          </button>
        </div>
      </div>

      {/* 2. Core KPI Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Total Revenue" 
          value={`$${summary.revenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={<DollarSign size={22} />} 
          desc={`${summary.completedOrders} orders completed & paid`}
          colorClass="bg-[#C21875]/15 text-[#C21875]"
          badge="SALES"
          href="/admin/orders"
        />
        <StatCard 
          title="Total Orders" 
          value={summary.totalOrders}
          icon={<ShoppingCart size={22} />} 
          desc={`${summary.pendingOrders} pending • ${summary.processingOrders} in process`}
          colorClass="bg-[#D6B36A]/15 text-[#D6B36A]"
          badge={summary.pendingOrders > 0 ? `${summary.pendingOrders} PENDING` : 'ACTIVE'}
          href="/admin/orders"
        />
        <StatCard 
          title="B2B RFQ Quotes" 
          value={summary.totalRFQs}
          icon={<FileText size={22} />} 
          desc={`${summary.newRFQs} new inquiries need response`}
          colorClass="bg-blue-500/15 text-blue-400"
          badge={summary.newRFQs > 0 ? `${summary.newRFQs} NEW` : 'WHOLESALE'}
          href="/admin/rfq"
        />
        <StatCard 
          title="Catalog Products" 
          value={summary.totalProducts}
          icon={<Box size={22} />} 
          desc={`${summary.activeProducts} active • ${summary.lowStockProducts} low stock`}
          colorClass="bg-emerald-500/15 text-emerald-400"
          badge={`${summary.totalCategories} CATS`}
          href="/admin/products"
        />
      </div>

      {/* Secondary Quick Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Link href="/admin/customers" className="bg-[#191019] p-3.5 rounded-xl border border-white/5 hover:border-white/20 transition-colors">
          <p className="text-[10px] uppercase font-mono text-white/40">Customers</p>
          <p className="text-xl font-bold text-white font-mono mt-0.5">{summary.totalCustomers}</p>
        </Link>
        <Link href="/admin/categories" className="bg-[#191019] p-3.5 rounded-xl border border-white/5 hover:border-white/20 transition-colors">
          <p className="text-[10px] uppercase font-mono text-white/40">Categories</p>
          <p className="text-xl font-bold text-white font-mono mt-0.5">{summary.totalCategories} <span className="text-xs text-white/40">({summary.totalSubcategories} subs)</span></p>
        </Link>
        <Link href="/admin/brands" className="bg-[#191019] p-3.5 rounded-xl border border-white/5 hover:border-white/20 transition-colors">
          <p className="text-[10px] uppercase font-mono text-white/40">Brands</p>
          <p className="text-xl font-bold text-white font-mono mt-0.5">{summary.totalBrands}</p>
        </Link>
        <Link href="/admin/reviews" className="bg-[#191019] p-3.5 rounded-xl border border-white/5 hover:border-white/20 transition-colors">
          <p className="text-[10px] uppercase font-mono text-white/40">Reviews</p>
          <p className="text-xl font-bold text-white font-mono mt-0.5">{summary.totalReviews} <span className="text-xs text-amber-400">({summary.pendingReviews} new)</span></p>
        </Link>
        <Link href="/admin/products?status=LOW_STOCK" className="bg-[#191019] p-3.5 rounded-xl border border-white/5 hover:border-white/20 transition-colors">
          <p className="text-[10px] uppercase font-mono text-amber-400">Low Stock</p>
          <p className="text-xl font-bold text-amber-400 font-mono mt-0.5">{summary.lowStockProducts}</p>
        </Link>
        <Link href="/admin/products?status=OUT_OF_STOCK" className="bg-[#191019] p-3.5 rounded-xl border border-white/5 hover:border-white/20 transition-colors">
          <p className="text-[10px] uppercase font-mono text-red-400">Out of Stock</p>
          <p className="text-xl font-bold text-red-400 font-mono mt-0.5">{summary.outOfStockProducts}</p>
        </Link>
      </div>

      {/* 3. Revenue Chart & Category Share Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Sales Chart */}
        <div className="lg:col-span-2 bg-[#191019] border border-white/5 p-6 rounded-2xl space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm uppercase tracking-wider text-[#D6B36A] flex items-center space-x-2">
                <TrendingUp size={16} />
                <span>Revenue Performance</span>
              </h3>
              <p className="text-[11px] text-white/40 mt-0.5">Monthly gross revenue from delivered and completed orders.</p>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
              Live Aggregate
            </span>
          </div>

          {monthlySales.length === 0 ? (
            <div className="h-56 flex items-center justify-center text-xs text-white/30 italic">
              No sales logged in the past 6 months yet.
            </div>
          ) : (
            <div className="flex items-end justify-between h-56 pt-6 px-2 border-l border-b border-white/10 relative">
              {monthlySales.map((m: any, idx: number) => {
                const heightPercentage = (m.value / maxSales) * 100;
                return (
                  <div key={idx} className="flex flex-col items-center flex-1 group relative mx-1.5">
                    <span className="absolute -top-7 opacity-0 group-hover:opacity-100 bg-[#120a12] border border-[#C21875] text-[10px] font-mono px-2 py-0.5 rounded text-[#C21875] font-bold z-10 transition-opacity">
                      ${m.value.toFixed(0)}
                    </span>
                    <div 
                      style={{ height: `${Math.max(8, heightPercentage)}%` }}
                      className="w-full bg-gradient-to-t from-[#5A1230] to-[#C21875] rounded-t-lg hover:to-[#E0248A] transition-all cursor-pointer shadow-lg"
                    />
                    <span className="text-[9px] text-white/50 uppercase tracking-widest mt-2 block font-semibold">{m.name}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Category Share */}
        <div className="bg-[#191019] border border-white/5 p-6 rounded-2xl space-y-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm uppercase tracking-wider text-[#C21875] flex items-center space-x-2">
                <Layers size={16} />
                <span>Top Categories</span>
              </h3>
              <Link href="/admin/categories" className="text-[10px] text-[#D6B36A] hover:underline font-bold uppercase">
                Manage
              </Link>
            </div>
            <p className="text-[11px] text-white/40 mt-0.5">Product distribution across root categories.</p>
          </div>

          <div className="space-y-3.5 flex-1 pt-2">
            {topCategories.slice(0, 5).map((cat: any) => {
              const maxCatCount = Math.max(...topCategories.map((c: any) => c.count), 1);
              const percentage = Math.round((cat.count / maxCatCount) * 100);
              return (
                <div key={cat.id} className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-white/80">{cat.name}</span>
                    <span className="text-white/40 font-mono text-[11px]">{cat.count} items</span>
                  </div>
                  <div className="w-full bg-[#120a12] h-2 rounded-full overflow-hidden border border-white/5">
                    <div 
                      style={{ width: `${percentage}%` }}
                      className="bg-gradient-to-r from-[#5A1230] to-[#C21875] h-full rounded-full"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <Link
            href="/admin/categories"
            className="w-full py-2 bg-white/5 hover:bg-white/10 rounded-xl text-center text-xs font-semibold text-white/70 hover:text-white transition-colors block"
          >
            View All Categories ({summary.totalCategories})
          </Link>
        </div>

      </div>

      {/* 4. Recent Transactions & Inquiries Split */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Recent Orders */}
        <div className="bg-[#191019] border border-white/5 p-6 rounded-2xl space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-sm uppercase tracking-wider text-[#D6B36A] flex items-center space-x-2">
              <ShoppingCart size={16} />
              <span>Recent Orders</span>
            </h3>
            <Link href="/admin/orders" className="text-[11px] text-[#C21875] font-bold uppercase tracking-wider hover:underline flex items-center space-x-1">
              <span>All Orders</span>
              <ArrowRight size={12} />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-white/5 text-white/40 uppercase font-mono tracking-wider text-[10px]">
                  <th className="py-2.5">Order Ref</th>
                  <th className="py-2.5">Customer</th>
                  <th className="py-2.5 text-center">Status</th>
                  <th className="py-2.5 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-white/30 italic">No orders recorded yet.</td>
                  </tr>
                ) : (
                  recentOrders.map((ord: any) => (
                    <tr key={ord.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-3 font-mono font-bold text-[#D6B36A]">{ord.orderNumber}</td>
                      <td className="py-3">
                        <span className="font-semibold text-white block truncate max-w-[140px]">{ord.customerName}</span>
                        <span className="text-[10px] text-white/40">{new Date(ord.createdAt).toLocaleDateString()}</span>
                      </td>
                      <td className="py-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] uppercase font-bold tracking-wider border ${
                          ord.status === 'DELIVERED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                          ord.status === 'PENDING' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                          'bg-blue-500/10 text-blue-400 border-blue-500/20'
                        }`}>
                          {ord.status}
                        </span>
                      </td>
                      <td className="py-3 text-right font-mono font-bold text-white">${ord.total.toFixed(2)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Quotes / Inquiries */}
        <div className="bg-[#191019] border border-white/5 p-6 rounded-2xl space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-sm uppercase tracking-wider text-[#C21875] flex items-center space-x-2">
              <FileText size={16} />
              <span>Recent B2B Inquiries</span>
            </h3>
            <Link href="/admin/rfq" className="text-[11px] text-[#D6B36A] font-bold uppercase tracking-wider hover:underline flex items-center space-x-1">
              <span>All Quotes</span>
              <ArrowRight size={12} />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-white/5 text-white/40 uppercase font-mono tracking-wider text-[10px]">
                  <th className="py-2.5">RFQ Code</th>
                  <th className="py-2.5">Client / Company</th>
                  <th className="py-2.5 text-center">Status</th>
                  <th className="py-2.5 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {recentRFQs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-white/30 italic">No RFQ inquiries logged yet.</td>
                  </tr>
                ) : (
                  recentRFQs.map((rfq: any) => (
                    <tr key={rfq.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-3 font-mono font-bold text-[#D6B36A]">{rfq.rfqNumber}</td>
                      <td className="py-3">
                        <span className="font-semibold text-white block truncate max-w-[140px]">{rfq.company || rfq.name}</span>
                        <span className="text-[10px] text-white/40 truncate max-w-[140px] block">{rfq.email}</span>
                      </td>
                      <td className="py-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] uppercase font-bold tracking-wider border ${
                          rfq.status === 'NEW' ? 'bg-[#C21875]/15 text-[#C21875] border-[#C21875]/30 animate-pulse' :
                          rfq.status === 'QUOTED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                          'bg-white/10 text-white/80 border-white/15'
                        }`}>
                          {rfq.status}
                        </span>
                      </td>
                      <td className="py-3 text-right text-white/40 font-mono text-[11px]">
                        {new Date(rfq.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* 5. Quick Shortcut CMS Navigation Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
        <Link 
          href="/admin/homepage" 
          className="bg-[#191019] border border-white/5 p-4 rounded-xl hover:border-[#C21875]/50 transition-all group flex items-center space-x-3"
        >
          <div className="p-2.5 rounded-lg bg-[#C21875]/10 text-[#C21875] group-hover:scale-110 transition-transform">
            <Eye size={18} />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white group-hover:text-[#C21875] transition-colors">Homepage Editor</h4>
            <p className="text-[10px] text-white/40">Sort & toggle sections</p>
          </div>
        </Link>

        <Link 
          href="/admin/banners" 
          className="bg-[#191019] border border-white/5 p-4 rounded-xl hover:border-[#D6B36A]/50 transition-all group flex items-center space-x-3"
        >
          <div className="p-2.5 rounded-lg bg-[#D6B36A]/10 text-[#D6B36A] group-hover:scale-110 transition-transform">
            <Star size={18} />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white group-hover:text-[#D6B36A] transition-colors">Hero & Banners</h4>
            <p className="text-[10px] text-white/40">Manage slider slides</p>
          </div>
        </Link>

        <Link 
          href="/admin/media" 
          className="bg-[#191019] border border-white/5 p-4 rounded-xl hover:border-blue-500/50 transition-all group flex items-center space-x-3"
        >
          <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-400 group-hover:scale-110 transition-transform">
            <PackageCheck size={18} />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors">Media Library</h4>
            <p className="text-[10px] text-white/40">Upload & preview assets</p>
          </div>
        </Link>

        <Link 
          href="/admin/settings" 
          className="bg-[#191019] border border-white/5 p-4 rounded-xl hover:border-emerald-500/50 transition-all group flex items-center space-x-3"
        >
          <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition-transform">
            <CheckCircle size={18} />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors">WhatsApp & Store</h4>
            <p className="text-[10px] text-white/40">Phone, rates & hours</p>
          </div>
        </Link>
      </div>

    </div>
  );
}
