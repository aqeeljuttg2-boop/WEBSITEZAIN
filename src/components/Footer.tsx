'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Phone, Mail, MapPin, ArrowUp } from 'lucide-react';
import { useRealtime } from '@/context/RealtimeContext';

let cachedFooterSettings: any = null;

export default function Footer() {
  const [settings, setSettings] = useState<{
    companyName?: string;
    companyPhone?: string;
    companyEmail?: string;
    companyAddress?: string;
    whatsappNumber?: string;
    instagramUrl?: string;
  }>(() => cachedFooterSettings || {
    companyName: 'Lash Tweezers Lounge',
    companyPhone: '+92-334-8012580',
    companyEmail: 'info@lashtweezerslounge.com',
    companyAddress: 'King99 Street Block No.99 Wajid Town, Dhattal Stop, Sialkot.',
    whatsappNumber: '+92 334 8012580',
    instagramUrl: 'https://www.instagram.com/lash_tweezers_lounge?igsi=dGl5cWUweXp0MDdj&utm_source=qr'
  });

  const loadFooterSettings = async (force: boolean = false) => {
    if (!force && cachedFooterSettings) return;
    try {
      const res = await fetch('/api/admin/settings');
      if (res.ok) {
        const data = await res.json();
        if (data.settings) {
          const newSettings = {
            companyName: data.settings.companyName || 'Lash Tweezers Lounge',
            companyPhone: data.settings.companyPhone || '+92-334-8012580',
            companyEmail: data.settings.companyEmail || 'info@lashtweezerslounge.com',
            companyAddress: data.settings.companyAddress || 'King99 Street Block No.99 Wajid Town, Dhattal Stop, Sialkot.',
            whatsappNumber: data.settings.whatsappNumber || '+92 334 8012580',
            instagramUrl: data.settings.instagramUrl || 'https://www.instagram.com/lash_tweezers_lounge?igsi=dGl5cWUweXp0MDdj&utm_source=qr'
          };
          cachedFooterSettings = newSettings;
          setSettings(newSettings);
        }
      }
    } catch (e) {
      console.error('Footer settings fetch error:', e);
    }
  };

  useEffect(() => {
    loadFooterSettings();
    const handleUpdate = () => loadFooterSettings(true);
    window.addEventListener('settings-updated', handleUpdate);
    return () => window.removeEventListener('settings-updated', handleUpdate);
  }, []);

  useRealtime('SETTINGS_UPDATED', () => {
    loadFooterSettings(true);
  });

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-gray-100 border-t border-gray-200 text-gray-600 text-sm relative">
      
      {/* Top Footer Section */}
      <div className="max-w-7xl mx-auto px-4 py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
        
        {/* Column 1: Contact us */}
        <div className="space-y-4">
          <h4 className="text-gray-900 font-bold uppercase tracking-wider text-xs border-b border-gray-200 pb-2">Contact us</h4>
          <p className="text-xs text-gray-500 leading-relaxed font-medium">
            {settings.companyName || 'Lash Tweezers Lounge'}
          </p>
          <div className="space-y-3 pt-1 text-xs text-gray-600">
            <p className="flex items-center space-x-2.5">
              <Phone size={14} className="text-[#C21875] shrink-0" />
              <a href={`tel:${(settings.companyPhone || '+923348012580').replace(/[^0-9+]/g, '')}`} className="hover:text-[#C21875] transition-colors font-mono font-bold">
                {settings.companyPhone || '+92-334-8012580'}
              </a>
            </p>
            <p className="flex items-center space-x-2.5">
              <Mail size={14} className="text-[#C21875] shrink-0" />
              <a href={`mailto:${settings.companyEmail || 'info@lashtweezerslounge.com'}`} className="hover:text-[#C21875] transition-colors">
                {settings.companyEmail || 'info@lashtweezerslounge.com'}
              </a>
            </p>
            <p className="flex items-start space-x-2.5">
              <MapPin size={14} className="text-[#C21875] shrink-0 mt-0.5" />
              <span className="leading-relaxed">{settings.companyAddress || 'King99 Street Block No.99 Wajid Town, Dhattal Stop, Sialkot.'}</span>
            </p>
          </div>
          
          {/* Official Social Links */}
          <div className="pt-3 space-y-2">
            <span className="text-[11px] font-bold text-gray-800 uppercase tracking-wider block">Official Social Profile</span>
            <a 
              href={settings.instagramUrl || "https://www.instagram.com/lash_tweezers_lounge"} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 px-3 py-2 bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 text-white rounded-xl text-xs font-semibold hover:shadow-lg hover:scale-105 transition-all shadow-sm"
              aria-label="Instagram Profile"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
              </svg>
              <span>@lash_tweezers_lounge</span>
            </a>
          </div>
        </div>

        {/* Column 2: Company */}
        <div className="space-y-4">
          <h4 className="text-gray-900 font-bold uppercase tracking-wider text-xs border-b border-gray-200 pb-2">Company</h4>
          <ul className="space-y-2.5 text-xs text-gray-600">
            <li><Link href="/about" className="hover:text-[#C21875] transition-colors">About Lash Tweezers Lounge</Link></li>
            <li><Link href="/returns" className="hover:text-[#C21875] transition-colors">Returns & Exchanges</Link></li>
            <li><Link href="/privacy" className="hover:text-[#C21875] transition-colors">Privacy Policy</Link></li>
            <li><Link href="/contact" className="hover:text-[#C21875] transition-colors">Contact Us</Link></li>
            <li><Link href="/faq" className="hover:text-[#C21875] transition-colors">FAQs</Link></li>
            <li><Link href="/terms" className="hover:text-[#C21875] transition-colors">Terms of Service</Link></li>
          </ul>
        </div>

        {/* Column 3: Info */}
        <div className="space-y-4">
          <h4 className="text-gray-900 font-bold uppercase tracking-wider text-xs border-b border-gray-200 pb-2">Info</h4>
          <ul className="space-y-2.5 text-xs text-gray-600">
            <li><Link href="/shop" className="hover:text-[#C21875] transition-colors">All Instruments Catalog</Link></li>
            <li><Link href="/wholesale" className="hover:text-[#C21875] transition-colors">Wholesale & OEM Inquiry</Link></li>
            <li><Link href="/shipping" className="hover:text-[#C21875] transition-colors">Shipping Information</Link></li>
            <li><Link href="/tracking" className="hover:text-[#C21875] transition-colors">TRACK YOUR ORDER</Link></li>
            <li><Link href="/certificates" className="hover:text-[#C21875] transition-colors">Quality Certifications</Link></li>
          </ul>
        </div>

        {/* Column 4: Direct WhatsApp & Newsletter */}
        <div className="space-y-4">
          <h4 className="text-gray-900 font-bold uppercase tracking-wider text-xs border-b border-gray-200 pb-2">Direct Inquiries</h4>
          <p className="text-xs text-gray-500 leading-relaxed">
            Need custom laser engraving, sample kits, or wholesale pricing? Chat with us directly on WhatsApp.
          </p>
          <a
            href={`https://wa.me/${(settings.whatsappNumber || '923348012580').replace(/[^0-9]/g, '')}?text=Hi,%20I'm%20inquiring%20about%20Lash%20Tweezers%20Lounge%20products.`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-[#C21875] hover:bg-[#A31260] text-white text-xs py-2.5 rounded-xl font-bold tracking-wider uppercase transition-colors flex items-center justify-center space-x-1.5 shadow"
          >
            <span>WhatsApp: {settings.whatsappNumber || '+92 334 8012580'}</span>
          </a>
        </div>
      </div>

      {/* Bottom Footer Section */}
      <div className="bg-gray-200 py-6 border-t border-gray-300 text-gray-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0 text-xs">
          <p>Copyright © {new Date().getFullYear()}, Lash Tweezers lounge - All Rights Reserved</p>
          <div className="flex space-x-6">
            <Link href="/privacy" className="hover:text-[#C21875] transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-[#C21875] transition-colors">Terms of Service</Link>
            <Link href="/shipping" className="hover:text-[#C21875] transition-colors">Shipping Policy</Link>
            <Link href="/returns" className="hover:text-[#C21875] transition-colors">Returns Policy</Link>
          </div>
        </div>
      </div>

      {/* Floating Chevron Up Button */}
      <button 
        onClick={scrollToTop}
        className="absolute bottom-6 right-6 p-2 bg-white rounded-full text-gray-600 hover:bg-[#C21875] hover:text-white border border-gray-300 shadow-md transition-all cursor-pointer"
        title="Scroll to top"
      >
        <ArrowUp size={16} />
      </button>
    </footer>
  );
}
