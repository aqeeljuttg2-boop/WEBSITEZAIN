'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { 
  BarChart3, Box, Layers, ShoppingCart, FileSpreadsheet, 
  Tag, MessageSquare, Settings, ArrowLeft, Loader2, LogOut,
  Image as ImageIcon, Layout, Menu as MenuIcon, X, Globe,
  Users, BookmarkCheck, FileText, ChevronRight, ExternalLink,
  Search, Bell, ShieldCheck, Sparkles, Sliders
} from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');

  // Route security checks
  React.useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else if (user.role !== 'SUPERADMIN' && user.role !== 'ADMIN' && user.role !== 'STAFF') {
        router.push('/account'); // redirect standard customers out of admin panel
      }
    }
  }, [user, loading, router]);

  // Close mobile nav on route change
  React.useEffect(() => {
    setIsMobileNavOpen(false);
  }, [pathname]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#140d14] flex items-center justify-center text-white">
        <div className="flex flex-col items-center space-y-4 p-8 bg-[#1c141c] border border-white/10 rounded-2xl shadow-2xl">
          <Loader2 size={36} className="animate-spin text-[#C21875]" />
          <span className="font-semibold text-sm tracking-wider uppercase text-white/80 font-mono">Authenticating Control Panel...</span>
        </div>
      </div>
    );
  }

  if (!user || (user.role !== 'SUPERADMIN' && user.role !== 'ADMIN' && user.role !== 'STAFF')) {
    return null;
  }

  const navSections = [
    {
      group: 'OVERVIEW & SALES',
      links: [
        { href: '/admin', label: 'Dashboard Overview', icon: <BarChart3 size={17} /> },
        { href: '/admin/orders', label: 'Customer Orders', icon: <ShoppingCart size={17} /> },
        { href: '/admin/rfq', label: 'Quotes & Inquiries', icon: <FileSpreadsheet size={17} /> },
        { href: '/admin/customers', label: 'Customer Accounts', icon: <Users size={17} /> },
      ]
    },
    {
      group: 'CATALOG & INVENTORY',
      links: [
        { href: '/admin/products', label: 'Products Catalog', icon: <Box size={17} /> },
        { href: '/admin/categories', label: 'Categories & Subs', icon: <Layers size={17} /> },
        { href: '/admin/brands', label: 'Brand Registry', icon: <BookmarkCheck size={17} /> },
        { href: '/admin/reviews', label: 'Reviews Manager', icon: <MessageSquare size={17} /> },
        { href: '/admin/coupons', label: 'Discount Coupons', icon: <Tag size={17} /> },
      ]
    },
    {
      group: 'STOREFRONT CMS & DESIGN',
      links: [
        { href: '/admin/homepage', label: 'Homepage Manager', icon: <Layout size={17} /> },
        { href: '/admin/banners', label: 'Banners & Sliders', icon: <ImageIcon size={17} /> },
        { href: '/admin/media', label: 'Media Library', icon: <Sparkles size={17} /> },
        { href: '/admin/pages', label: 'Pages & Content', icon: <FileText size={17} /> },
        { href: '/admin/menus', label: 'Menu & Navigation', icon: <MenuIcon size={17} /> },
      ]
    },
    {
      group: 'SYSTEM & INTEGRATIONS',
      links: [
        { href: '/admin/seo', label: 'Global SEO Settings', icon: <Globe size={17} /> },
        { href: '/admin/settings', label: 'Store & WhatsApp', icon: <Settings size={17} /> },
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-[#120a12] text-white flex flex-col lg:flex-row antialiased">
      
      {/* MOBILE TOP BAR */}
      <header className="lg:hidden bg-[#1c141c] border-b border-white/10 px-4 py-3.5 flex items-center justify-between sticky top-0 z-40">
        <Link href="/admin" className="flex items-center space-x-2">
          <span className="text-sm font-black tracking-wider text-white">
            LASH TWEEZERS LOUNGE<span className="text-[#C21875]">.</span>
            <span className="text-[9px] text-[#D6B36A] uppercase font-semibold tracking-widest block font-mono">CMS Panel</span>
          </span>
        </Link>
        <button
          onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
          className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white"
          aria-label="Toggle navigation"
        >
          {isMobileNavOpen ? <X size={20} /> : <MenuIcon size={20} />}
        </button>
      </header>

      {/* BACKDROP FOR MOBILE */}
      {isMobileNavOpen && (
        <div 
          onClick={() => setIsMobileNavOpen(false)}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden"
        />
      )}

      {/* LEFT SIDEBAR NAVIGATION */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-[#191019] border-r border-[#C21875]/20 flex flex-col justify-between shrink-0 transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:static lg:h-screen
        ${isMobileNavOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        
        <div className="flex flex-col h-full overflow-hidden">
          
          {/* Header branding */}
          <div className="p-5 border-b border-white/5 bg-[#140d14] flex items-center justify-between shrink-0">
            <Link href="/admin" className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#5A1230] to-[#C21875] flex items-center justify-center shadow-md">
                <ShieldCheck size={18} className="text-white" />
              </div>
              <div>
                <span className="text-sm font-black tracking-wider text-white leading-tight block">
                  LTL CONTROL<span className="text-[#C21875]">.</span>
                </span>
                <span className="text-[9px] text-[#D6B36A] uppercase font-bold tracking-widest font-mono">Enterprise CMS</span>
              </div>
            </Link>
            <button 
              onClick={() => setIsMobileNavOpen(false)}
              className="lg:hidden text-white/60 hover:text-white"
            >
              <X size={18} />
            </button>
          </div>

          {/* Quick Filter Search in Sidebar */}
          <div className="p-3 border-b border-white/5 shrink-0">
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
              <input 
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Jump to CMS module..."
                className="w-full bg-[#120a12] border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#C21875]"
              />
            </div>
          </div>

          {/* Navigation Links Scrollable Container */}
          <nav className="flex-1 p-3 space-y-5 overflow-y-auto custom-scrollbar">
            {navSections.map((section, sIdx) => {
              const filteredLinks = section.links.filter(l => 
                !searchFilter || l.label.toLowerCase().includes(searchFilter.toLowerCase())
              );

              if (filteredLinks.length === 0) return null;

              return (
                <div key={sIdx} className="space-y-1">
                  <span className="text-[10px] font-bold text-white/35 uppercase tracking-widest px-3 block font-mono">
                    {section.group}
                  </span>
                  <div className="space-y-0.5 pt-1">
                    {filteredLinks.map((link) => {
                      const isActive = pathname === link.href;
                      return (
                        <Link
                          key={link.href}
                          href={link.href}
                          className={`flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                            isActive
                              ? 'bg-[#C21875] text-white shadow-lg shadow-[#C21875]/25 font-bold'
                              : 'text-white/70 hover:bg-white/5 hover:text-white'
                          }`}
                        >
                          <div className="flex items-center space-x-2.5">
                            <span className={isActive ? 'text-white' : 'text-white/60'}>{link.icon}</span>
                            <span>{link.label}</span>
                          </div>
                          {isActive && <ChevronRight size={13} className="opacity-80" />}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </nav>

          {/* Footer User Info & Actions */}
          <div className="p-3 border-t border-white/5 bg-[#140d14] space-y-2 shrink-0">
            <div className="flex items-center justify-between px-2 py-1">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-full bg-[#C21875]/20 border border-[#C21875]/40 flex items-center justify-center text-xs font-bold text-[#D6B36A]">
                  {user.name ? user.name.slice(0, 1).toUpperCase() : 'A'}
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs font-bold text-white truncate max-w-[120px]">{user.name}</p>
                  <span className="text-[9px] text-[#D6B36A] uppercase font-mono font-semibold">{user.role}</span>
                </div>
              </div>
              <button
                onClick={logout}
                title="Sign Out"
                className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <LogOut size={16} />
              </button>
            </div>

            <Link
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-white/5 hover:bg-[#C21875]/20 text-[#D6B36A] hover:text-white border border-white/5 transition-all"
            >
              <ExternalLink size={13} />
              <span>Live Website</span>
            </Link>
          </div>

        </div>

      </aside>

      {/* RIGHT: Main Admin Viewport */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        
        {/* Top Navbar */}
        <header className="hidden lg:flex bg-[#191019]/90 backdrop-blur-md border-b border-white/5 px-8 py-3.5 items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <span className="text-xs font-mono text-[#D6B36A] font-bold uppercase tracking-widest">
              Lash Tweezers Lounge
            </span>
            <span className="text-white/20">•</span>
            <div className="flex items-center space-x-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Real-Time Engine Active</span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <Link
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-1.5 text-xs text-[#D6B36A] hover:text-white font-semibold transition-colors px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10"
            >
              <ExternalLink size={13} />
              <span>View Storefront</span>
            </Link>

            <Link
              href="/admin/settings"
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors"
              title="Store Settings"
            >
              <Settings size={16} />
            </Link>
          </div>
        </header>

        {/* Scrollable Page Content */}
        <main className="flex-1 p-5 lg:p-8 overflow-y-auto">
          {children}
        </main>

      </div>

    </div>
  );
}
