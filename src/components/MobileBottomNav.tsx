'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ShoppingBag, FileText, ShoppingCart, MessageCircle } from 'lucide-react';
import { useCart } from '@/context/CartContext';

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { getCartItemsCount, getQuoteItemsCount } = useCart();

  const cartCount = getCartItemsCount();
  const quoteCount = getQuoteItemsCount();

  const handleTriggerChat = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('open-ltl-chat'));
    }
  };

  // Do not render bottom bar in admin dashboard
  if (pathname.startsWith('/admin')) {
    return null;
  }

  const navItems = [
    { href: '/', label: 'Home', icon: <Home size={19} /> },
    { href: '/shop', label: 'Shop', icon: <ShoppingBag size={19} /> },
    { 
      href: '/quote', 
      label: 'RFQ Quote', 
      icon: <FileText size={19} />, 
      badge: quoteCount,
      badgeColor: 'bg-[#D6B36A]'
    },
    { 
      href: '/cart', 
      label: 'Cart', 
      icon: <ShoppingCart size={19} />, 
      badge: cartCount,
      badgeColor: 'bg-[#C21875]'
    },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] px-2 py-1.5 safe-area-pb">
      <div className="flex justify-around items-center">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all relative ${
                isActive ? 'text-[#C21875] font-bold' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <div className="relative">
                {item.icon}
                {item.badge !== undefined && item.badge > 0 && (
                  <span className={`absolute -top-1.5 -right-2.5 ${item.badgeColor} text-white font-bold text-[9px] w-4 h-4 rounded-full flex items-center justify-center border-2 border-white shadow-sm`}>
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] uppercase font-mono tracking-tight mt-0.5">
                {item.label}
              </span>
            </Link>
          );
        })}

        {/* 1-Tap Chat Assistant Trigger */}
        <button
          onClick={handleTriggerChat}
          className="flex flex-col items-center justify-center py-1 px-3 rounded-xl text-gray-500 hover:text-[#C21875] transition-all cursor-pointer"
        >
          <div className="relative">
            <MessageCircle size={19} />
            <span className="absolute -top-0.5 -right-1 w-2 h-2 bg-[#C21875] rounded-full" />
          </div>
          <span className="text-[10px] uppercase font-mono tracking-tight mt-0.5">
            Support
          </span>
        </button>
      </div>
    </div>
  );
}
