'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { User, FileText, ShoppingBag, LogOut, Loader2 } from 'lucide-react';

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, logout } = useAuth();

  // Route protection
  React.useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center text-white">
        <Loader2 size={32} className="animate-spin text-[#C21875]" />
        <span className="ml-3 font-semibold text-sm">Authenticating session...</span>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const links = [
    { href: '/account', label: 'My Profile', icon: <User size={16} /> },
    { href: '/account/orders', label: 'Order History', icon: <ShoppingBag size={16} /> },
    { href: '/account/quotes', label: 'B2B RFQ Inquiries', icon: <FileText size={16} /> },
  ];

  return (
    <div className="py-12 max-w-7xl mx-auto px-4 text-white">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-10 items-start">
        
        {/* LEFT Sidebar Navigation */}
        <div className="lg:col-span-1 bg-[#1c141c] border border-white/5 p-6 rounded-2xl space-y-6">
          <div className="border-b border-white/5 pb-4">
            <h3 className="font-bold text-sm text-white">{user.name}</h3>
            <p className="text-xs text-white/40 truncate">{user.email}</p>
            <span className="inline-block mt-2 px-2 py-0.5 text-[9px] uppercase font-bold tracking-wider bg-[#C21875] text-white rounded">
              {user.role}
            </span>
          </div>

          <nav className="flex flex-col space-y-1">
            {links.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center space-x-2.5 px-4 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors ${
                    isActive
                      ? 'bg-[#C21875] text-white'
                      : 'text-white/60 hover:bg-[#C21875]/10 hover:text-white'
                  }`}
                >
                  {link.icon}
                  <span>{link.label}</span>
                </Link>
              );
            })}

            <button
              onClick={logout}
              className="w-full flex items-center space-x-2.5 px-4 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider text-red-400 hover:bg-red-500/10 transition-colors text-left"
            >
              <LogOut size={16} />
              <span>Sign Out</span>
            </button>
          </nav>
        </div>

        {/* RIGHT Main Content Viewport */}
        <div className="lg:col-span-3">
          {children}
        </div>

      </div>
    </div>
  );
}
