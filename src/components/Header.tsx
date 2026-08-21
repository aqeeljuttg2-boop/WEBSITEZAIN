'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useCart, Product } from '@/context/CartContext';
import { 
  Search, User, ShoppingBag, Heart, FileText, Phone, Menu, X, 
  ChevronDown, LogOut, CheckCircle, ExternalLink, ChevronRight, Layers
} from 'lucide-react';
import { useRealtime } from '@/context/RealtimeContext';

interface NavCategory {
  id: string;
  name: string;
  slug: string;
  subcategories?: { id: string; name: string; slug: string }[];
}

export default function Header() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { cart, quote, getCartItemsCount, getQuoteItemsCount } = useCart();
  const [searchQuery, setSearchQuery] = useState('');
  const [autocompleteResults, setAutocompleteResults] = useState<any[]>([]);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  
  // Dynamic categories and settings from database
  const [categories, setCategories] = useState<NavCategory[]>([]);
  const [storeSettings, setStoreSettings] = useState<{
    announcementText?: string;
    whatsappNumber?: string;
    companyPhone?: string;
    instagramUrl?: string;
  }>({
    announcementText: 'OEM & Custom Private Label Manufacturing • Direct Factory Pricing',
    whatsappNumber: '+923348012580',
    companyPhone: '+92 334 8012580',
    instagramUrl: 'https://www.instagram.com/lash_tweezers_lounge?igsi=dGl5cWUweXp0MDdj&utm_source=qr'
  });

  const autocompleteRef = useRef<HTMLDivElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Fetch dynamic categories for navbar
  const loadNavCategories = async () => {
    try {
      const res = await fetch('/api/categories', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data.categories && data.categories.length > 0) {
          setCategories(data.categories);
        }
      }
    } catch (err) {
      console.error('Error fetching navbar categories:', err);
    }
  };

  // Fetch dynamic settings for header
  const loadSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data.settings) {
          setStoreSettings(prev => ({
            ...prev,
            announcementText: data.settings.announcementText || prev.announcementText,
            whatsappNumber: data.settings.whatsappNumber || prev.whatsappNumber,
            companyPhone: data.settings.companyPhone || prev.companyPhone,
            instagramUrl: data.settings.instagramUrl || prev.instagramUrl
          }));
        }
      }
    } catch (err) {
      console.error('Error fetching settings for header:', err);
    }
  };

  useEffect(() => {
    loadNavCategories();
    loadSettings();

    // Listen for custom category updates from admin panel
    const handleRefresh = () => {
      loadNavCategories();
      loadSettings();
    };
    window.addEventListener('categories-updated', handleRefresh);
    window.addEventListener('settings-updated', handleRefresh);
    return () => {
      window.removeEventListener('categories-updated', handleRefresh);
      window.removeEventListener('settings-updated', handleRefresh);
    };
  }, []);

  // Real-time live synchronization for Header
  useRealtime(
    ['SETTINGS_UPDATED', 'CATEGORY_CREATED', 'CATEGORY_UPDATED', 'CATEGORY_DELETED', 'CATEGORY_REORDERED'], 
    (event) => {
      if (event.type === 'SETTINGS_UPDATED') loadSettings();
      else loadNavCategories();
    }
  );

  // Click outside listener for dropdowns
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (autocompleteRef.current && !autocompleteRef.current.contains(event.target as Node)) {
        setShowAutocomplete(false);
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch autocomplete results
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setAutocompleteResults([]);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      try {
        const res = await fetch(`/api/products?search=${encodeURIComponent(searchQuery)}&limit=5`, { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          setAutocompleteResults(data.products);
        }
      } catch (e) {
        console.error('Autocomplete fetch error:', e);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setShowAutocomplete(false);
      router.push(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleAutocompleteItemClick = (slug: string) => {
    setShowAutocomplete(false);
    setSearchQuery('');
    router.push(`/product/${slug}`);
  };

  return (
    <>
      {/* Top Notification / Contact Strip */}
      <div className="bg-[#171017] text-white text-[11px] py-2 px-4 border-b border-white/10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center space-y-1 md:space-y-0">
          <div className="flex items-center space-x-4">
            <span className="flex items-center space-x-1.5 text-white/90">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D6B36A] animate-pulse"></span>
              <span className="font-semibold uppercase tracking-wider text-[10px]">
                {storeSettings.announcementText || 'Manufacturer & Global Exporter'}
              </span>
            </span>
            <span className="hidden sm:inline text-white/40">|</span>
            <span className="hidden sm:inline text-white/70">ISO 9001:2015 & cGMP Quality Instruments</span>
          </div>

          <div className="flex items-center space-x-6 text-[11px] font-medium">
            <a 
              href={storeSettings.instagramUrl || "https://www.instagram.com/lash_tweezers_lounge"} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-[#D6B36A] hover:underline flex items-center space-x-1"
            >
              <span>Instagram: @lash_tweezers_lounge</span>
              <ExternalLink size={10} />
            </a>
            <a 
              href={`https://wa.me/${(storeSettings.whatsappNumber || '923348012580').replace(/[^0-9]/g, '')}`}
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-white hover:text-[#25D366] transition-colors flex items-center space-x-1"
            >
              <Phone size={11} className="text-[#25D366]" />
              <span>WhatsApp: {storeSettings.whatsappNumber || '+92 334 8012580'}</span>
            </a>
            <Link href="/tracking" className="text-white/80 hover:text-white transition-colors">
              Track Order
            </Link>
          </div>
        </div>
      </div>

      {/* Main Sticky Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100 text-gray-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 h-16 md:h-20 flex items-center justify-between">
          
          {/* LEFT: Logo */}
          <Link href="/" className="flex items-center space-x-2 group shrink-0">
            <span className="text-base sm:text-lg md:text-2xl font-black tracking-tight text-[#C21875] font-sans">
              <span className="inline md:hidden">LTL</span>
              <span className="hidden md:inline">LASH TWEEZERS LOUNGE</span>
              <span className="text-black">.</span>
            </span>
          </Link>

          {/* CENTER: Search Bar with Autocomplete */}
          <div className="hidden lg:block flex-1 max-w-lg mx-8 relative" ref={autocompleteRef}>
            <form onSubmit={handleSearchSubmit} className="relative flex">
              <input
                type="text"
                placeholder="Search tweezers, barber shears, nail care..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowAutocomplete(true);
                }}
                onFocus={() => setShowAutocomplete(true)}
                className="w-full bg-white border border-gray-300 hover:border-[#C21875] focus:border-[#C21875] text-gray-800 placeholder-gray-400 text-sm px-5 py-2.5 pr-14 rounded-full transition-all focus:outline-none focus:ring-1 focus:ring-[#C21875]"
              />
              <button 
                type="submit" 
                className="absolute right-0 top-0 bottom-0 bg-[#C21875] hover:bg-[#A31260] text-white px-5 rounded-r-full flex items-center justify-center transition-colors cursor-pointer"
              >
                <Search size={16} />
              </button>
            </form>

            {/* Autocomplete Dropdown */}
            {showAutocomplete && autocompleteResults.length > 0 && (
              <div className="absolute left-0 right-0 mt-2 bg-white border border-gray-200 rounded-2xl shadow-2xl overflow-hidden z-50">
                <div className="py-1">
                  {autocompleteResults.map((product) => {
                    const firstImg = product.images ? product.images.split(',')[0] : '';
                    return (
                      <button
                        key={product.id}
                        onClick={() => handleAutocompleteItemClick(product.slug)}
                        className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center justify-between border-b border-gray-100 last:border-0 transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gray-50 rounded border border-gray-200 flex items-center justify-center text-xs overflow-hidden shrink-0">
                            {firstImg ? (
                              <img 
                                src={firstImg} 
                                alt={product.name} 
                                className="object-cover w-full h-full"
                              />
                            ) : (
                              <span className="text-gray-300">IMG</span>
                            )}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-gray-800 line-clamp-1">{product.name}</p>
                            <p className="text-[10px] text-gray-400 font-mono">{product.productCode} • {product.category?.name || 'Instrument'}</p>
                          </div>
                        </div>
                        <span className="text-xs font-bold text-[#C21875] font-mono shrink-0 ml-2">
                          Rs. {product.singlePrice.toLocaleString()}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT: User Navigation & Actions */}
          <div className="flex items-center space-x-4 md:space-x-6">
            
            {/* Wholesale RFQ Quote Icon */}
            <Link 
              href="/quote" 
              className="relative flex items-center space-x-1 text-gray-600 hover:text-[#C21875] transition-colors"
              title="B2B Wholesale RFQ Basket"
            >
              <div className="relative">
                <FileText size={22} />
                {getQuoteItemsCount() > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-[#D6B36A] text-white font-bold text-[9px] w-4 h-4 rounded-full flex items-center justify-center">
                    {getQuoteItemsCount()}
                  </span>
                )}
              </div>
              <span className="hidden xl:inline text-xs font-bold uppercase tracking-wider">RFQ Quote</span>
            </Link>

            {/* Shopping Cart Icon */}
            <Link 
              href="/cart" 
              className="relative flex items-center space-x-1 text-gray-600 hover:text-[#C21875] transition-colors"
              title="Shopping Cart"
            >
              <div className="relative">
                <ShoppingBag size={22} />
                {getCartItemsCount() > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-[#C21875] text-white font-bold text-[9px] w-4 h-4 rounded-full flex items-center justify-center">
                    {getCartItemsCount()}
                  </span>
                )}
              </div>
              <span className="hidden xl:inline text-xs font-bold uppercase tracking-wider">Cart</span>
            </Link>

            {/* User Account / Profile Menu */}
            <div className="relative" ref={profileMenuRef}>
              {user ? (
                <>
                  <button
                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                    className="flex items-center space-x-1.5 text-gray-700 hover:text-[#C21875] transition-colors font-bold text-xs uppercase tracking-wider focus:outline-none"
                  >
                    <div className="w-7 h-7 rounded-full bg-[#C21875] text-white flex items-center justify-center text-xs">
                      {user.name ? user.name[0].toUpperCase() : 'U'}
                    </div>
                    <span className="hidden md:inline max-w-[90px] truncate">{user.name}</span>
                    <ChevronDown size={14} />
                  </button>

                  {showProfileMenu && (
                    <div className="absolute right-0 mt-3 w-52 bg-white border border-gray-200 rounded-2xl shadow-2xl py-2 z-50">
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-xs font-bold text-gray-800 truncate">{user.name}</p>
                        <p className="text-[10px] text-gray-400 truncate">{user.email}</p>
                        <span className="inline-block px-1.5 py-0.5 bg-pink-100 text-[#C21875] text-[9px] font-bold uppercase rounded mt-1">
                          {user.role}
                        </span>
                      </div>

                      {user.role === 'SUPERADMIN' || user.role === 'ADMIN' ? (
                        <Link
                          href="/admin"
                          onClick={() => setShowProfileMenu(false)}
                          className="block px-4 py-2 text-xs font-bold text-[#C21875] hover:bg-pink-50 transition-colors"
                        >
                          ⚙️ Admin Dashboard
                        </Link>
                      ) : null}

                      <Link
                        href="/account"
                        onClick={() => setShowProfileMenu(false)}
                        className="block px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        My Account Overview
                      </Link>
                      <Link
                        href="/account/orders"
                        onClick={() => setShowProfileMenu(false)}
                        className="block px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        Order History
                      </Link>
                      <Link
                        href="/account/quotes"
                        onClick={() => setShowProfileMenu(false)}
                        className="block px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        My B2B Quotes
                      </Link>

                      <div className="border-t border-gray-100 pt-1">
                        <button
                          onClick={() => {
                            setShowProfileMenu(false);
                            logout();
                          }}
                          className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center space-x-1.5 transition-colors"
                        >
                          <LogOut size={13} />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <Link 
                  href="/login" 
                  className="flex items-center space-x-1.5 text-gray-600 hover:text-[#C21875] transition-colors text-xs font-bold uppercase tracking-wider"
                >
                  <User size={22} />
                  <span className="hidden md:inline">Login</span>
                </Link>
              )}
            </div>

            {/* Mobile Hamburger menu */}
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden text-gray-600 hover:text-[#C21875] transition-colors focus:outline-none"
            >
              {isMobileMenuOpen ? <X size={26} /> : <Menu size={26} />}
            </button>
          </div>
        </div>

        {/* Desktop Dynamic Navigation Bar: Solid Magenta Accent */}
        <nav className="hidden lg:block bg-[#C21875] py-3.5 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 flex justify-center items-center space-x-6 xl:space-x-8 text-[11px] font-bold uppercase tracking-wider text-white">
            <Link href="/" className="hover:text-white/80 transition-colors">Home</Link>
            <Link href="/shop" className="hover:text-white/80 transition-colors">All Products</Link>
            
            {/* Dynamic Root Categories from Database */}
            {categories.map((cat) => (
              <div 
                key={cat.id} 
                className="relative group"
                onMouseEnter={() => setActiveDropdown(cat.id)}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <Link 
                  href={`/shop?category=${cat.slug}`}
                  className="hover:text-white/80 transition-colors flex items-center space-x-1 py-1"
                >
                  <span>{cat.name}</span>
                  {cat.subcategories && cat.subcategories.length > 0 && (
                    <ChevronDown size={11} className="group-hover:rotate-180 transition-transform opacity-75" />
                  )}
                </Link>

                {/* Subcategory Hover Flyout Dropdown */}
                {cat.subcategories && cat.subcategories.length > 0 && activeDropdown === cat.id && (
                  <div className="absolute left-0 top-full mt-1 w-56 bg-[#171017] border border-white/15 rounded-xl shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                    <Link
                      href={`/shop?category=${cat.slug}`}
                      className="block px-4 py-2 text-[11px] font-bold text-[#D6B36A] hover:bg-white/10 border-b border-white/10 mb-1"
                    >
                      All {cat.name}
                    </Link>
                    {cat.subcategories.map((sub) => (
                      <Link
                        key={sub.id}
                        href={`/shop?category=${sub.slug}`}
                        className="block px-4 py-1.5 text-[11px] font-medium text-white/90 hover:text-white hover:bg-[#C21875] transition-colors"
                      >
                        {sub.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}

            <Link href="/catalog" className="hover:text-white/80 transition-colors">PDF Catalogues</Link>
            <Link href="/wholesale" className="hover:text-white/80 transition-colors text-[#D6B36A]">B2B Wholesale</Link>
            <Link href="/manufacturing" className="hover:text-white/80 transition-colors">Custom OEM</Link>
          </div>
        </nav>

        {/* Mobile Dynamic Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="lg:hidden absolute top-16 md:top-20 left-0 right-0 bg-white border-b border-gray-200 shadow-2xl py-6 px-6 z-50 max-h-[80vh] overflow-y-auto">
            <form onSubmit={handleSearchSubmit} className="mb-6 relative">
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 text-gray-800 placeholder-gray-400 text-sm px-4 py-2.5 rounded-full"
              />
              <button type="submit" className="absolute right-3.5 top-3 text-gray-400">
                <Search size={18} />
              </button>
            </form>
            
            <div className="flex flex-col space-y-3 font-bold uppercase tracking-wider text-xs text-gray-700">
              <Link href="/" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-[#C21875] transition-colors py-1">Home</Link>
              <Link href="/shop" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-[#C21875] transition-colors py-1">All Products</Link>
              
              {/* Dynamic Categories in Mobile Drawer */}
              {categories.map((cat) => (
                <div key={cat.id} className="border-b border-gray-100 pb-2">
                  <Link 
                    href={`/shop?category=${cat.slug}`} 
                    onClick={() => setIsMobileMenuOpen(false)} 
                    className="hover:text-[#C21875] transition-colors flex items-center justify-between py-1 text-gray-800"
                  >
                    <span>{cat.name}</span>
                    <ChevronRight size={13} className="text-[#C21875]" />
                  </Link>

                  {/* Subcategories list */}
                  {cat.subcategories && cat.subcategories.length > 0 && (
                    <div className="pl-3 mt-1 space-y-1 border-l-2 border-[#C21875]/20">
                      {cat.subcategories.map((sub) => (
                        <Link
                          key={sub.id}
                          href={`/shop?category=${sub.slug}`}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="block text-[11px] text-gray-500 hover:text-[#C21875] normal-case py-0.5"
                        >
                          {sub.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              <Link href="/catalog" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-[#C21875] transition-colors py-1">PDF Catalogues</Link>
              <Link href="/wholesale" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-[#C21875] transition-colors text-[#D6B36A] py-1">B2B Wholesale</Link>
              <Link href="/manufacturing" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-[#C21875] transition-colors py-1">Custom OEM</Link>
            </div>
          </div>
        )}
      </header>
    </>
  );
}
