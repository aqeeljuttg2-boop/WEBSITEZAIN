'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { 
  Settings, Phone, Mail, MapPin, DollarSign, 
  MessageSquare, Save, Loader2, Check, Share2, 
  Clock, ShieldCheck, Sparkles, Building, Info, RefreshCw, Zap
} from 'lucide-react';
import { useRealtime } from '@/context/RealtimeContext';

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({
    companyName: 'Lash Tweezers lounge',
    companyEmail: 'info@lashtweezerslounge.com',
    companyPhone: '+92-334-8012580',
    whatsappNumber: '+923348012580',
    companyAddress: 'King99 Street Block No.99 Wajid Town, Dhattal Stop, Sialkot.',
    businessHours: 'Mon - Sat: 9:00 AM - 6:00 PM (PKT)',
    instagramUrl: 'https://www.instagram.com/lash_tweezers_lounge?igsi=dGl5cWUweXp0MDdj&utm_source=qr',
    facebookUrl: 'https://facebook.com',
    youtubeUrl: 'https://youtube.com',
    linkedinUrl: 'https://linkedin.com',
    tiktokUrl: '',
    pinterestUrl: '',
    currency: 'PKR',
    currencySymbol: 'Rs.',
    taxRate: '0.05',
    shippingRate: '150.00',
    freeShippingThreshold: '2500.00',
    minOrderQuantity: '1',
    announcementText: 'Manufacturer & Global Exporter • Worldwide Express Shipping Available',
    whatsappGreeting: "Hello! Welcome to Lash Tweezers Lounge. How can we assist you with our salon & beauty instruments today?",
    whatsappProductTemplate: "Hi, I'm interested in ordering/inquiring about: {product_name} (Code: {sku}). Quantity: {quantity}. Please provide pricing and shipping details. {url}",
    whatsappQuoteTemplate: "Hi, I would like to request a custom B2B wholesale quotation from Lash Tweezers Lounge.",
    floatingWhatsappEnabled: 'true'
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'business' | 'whatsapp' | 'social'>('general');
  const initialLoadDone = useRef(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Subscribe to real-time events from other tabs
  useRealtime('SETTINGS_UPDATED', (event) => {
    if (event.data && typeof event.data === 'object') {
      setSettings(prev => ({ ...prev, ...event.data }));
      setAutoSaveStatus('saved');
      setTimeout(() => setAutoSaveStatus('idle'), 2500);
    }
  });

  const loadSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setSettings(prev => ({ ...prev, ...(data.settings || {}) }));
      }
    } catch (e) {
      console.error('Load settings error:', e);
    } finally {
      setLoading(false);
      initialLoadDone.current = true;
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const saveSettingsToDb = useCallback(async (currentSettings: Record<string, string>, isManual: boolean = false) => {
    if (isManual) {
      setSaving(true);
    } else {
      setAutoSaveStatus('saving');
    }

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentSettings)
      });

      if (res.ok) {
        if (isManual) {
          setSavedSuccess(true);
          setTimeout(() => setSavedSuccess(false), 3000);
        } else {
          setAutoSaveStatus('saved');
          setTimeout(() => setAutoSaveStatus('idle'), 2500);
        }
      }
    } catch (e) {
      console.error('Save settings error:', e);
    } finally {
      setSaving(false);
    }
  }, []);

  // Continuous real-time auto-save debounced whenever settings change
  const handleSettingChange = (key: string, value: string) => {
    const updated = { ...settings, [key]: value };
    setSettings(updated);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (initialLoadDone.current) {
      setAutoSaveStatus('saving');
      debounceTimerRef.current = setTimeout(() => {
        saveSettingsToDb(updated, false);
      }, 650);
    }
  };

  const handleManualSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    await saveSettingsToDb(settings, true);
  };

  if (loading) {
    return (
      <div className="min-h-[300px] flex items-center justify-center text-white">
        <Loader2 size={32} className="animate-spin text-[#C21875]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      
      {/* 1. Header with Real-Time Indicator */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Website & WhatsApp Settings</h1>
            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono font-bold uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Realtime Auto-Save</span>
            </span>
          </div>
          <p className="text-xs text-white/50 mt-1">
            Configure contact info, business rules, currency, social profiles, and WhatsApp automation templates.
          </p>
        </div>

        {/* Live Auto-Save Status Badge */}
        <div className="flex items-center space-x-3 shrink-0">
          <div className="flex items-center space-x-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl text-xs font-mono">
            {autoSaveStatus === 'saving' || saving ? (
              <>
                <Loader2 size={13} className="animate-spin text-amber-400" />
                <span className="text-amber-300 font-semibold">Auto-saving live...</span>
              </>
            ) : autoSaveStatus === 'saved' || savedSuccess ? (
              <>
                <Check size={13} className="text-emerald-400" />
                <span className="text-emerald-400 font-semibold">All changes saved live</span>
              </>
            ) : (
              <>
                <Zap size={13} className="text-[#C21875]" />
                <span className="text-white/60">Live Continuous Sync</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 2. Navigation Tabs */}
      <div className="flex border-b border-white/5 bg-[#191019] p-2 rounded-2xl space-x-2 overflow-x-auto">
        {[
          { id: 'general', label: 'General & Contact', icon: <Building size={14} /> },
          { id: 'whatsapp', label: 'WhatsApp Automation', icon: <MessageSquare size={14} /> },
          { id: 'business', label: 'Business & Shipping', icon: <DollarSign size={14} /> },
          { id: 'social', label: 'Social Profiles', icon: <Share2 size={14} /> },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`flex-1 min-w-[140px] py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center space-x-2 ${
              activeTab === t.id
                ? 'bg-[#C21875] text-white shadow-md'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            {t.icon}
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* 3. Settings Form */}
      {/* 3. Settings Form */}
      <form onSubmit={handleManualSave} className="bg-[#191019] border border-white/5 p-6 rounded-2xl space-y-6">
        
        {/* TAB 1: General & Contact Info */}
        {activeTab === 'general' && (
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#D6B36A] flex items-center space-x-2">
              <Building size={15} />
              <span>Company Information & Contact</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-white/70 block mb-1">Company / Store Name</label>
                <input
                  type="text"
                  value={settings.companyName || ''}
                  onChange={(e) => handleSettingChange('companyName', e.target.value)}
                  className="w-full bg-[#120a12] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:border-[#C21875] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-white/70 block mb-1">Top Announcement Bar Text</label>
                <input
                  type="text"
                  value={settings.announcementText || ''}
                  onChange={(e) => handleSettingChange('announcementText', e.target.value)}
                  className="w-full bg-[#120a12] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:border-[#C21875] focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-white/70 block mb-1">Official Contact Email</label>
                <input
                  type="email"
                  value={settings.companyEmail || ''}
                  onChange={(e) => handleSettingChange('companyEmail', e.target.value)}
                  className="w-full bg-[#120a12] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:border-[#C21875] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-white/70 block mb-1">Phone / Telephone</label>
                <input
                  type="text"
                  value={settings.companyPhone || ''}
                  onChange={(e) => handleSettingChange('companyPhone', e.target.value)}
                  className="w-full bg-[#120a12] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:border-[#C21875] focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-white/70 block mb-1">Physical Address / Factory Zone</label>
                <input
                  type="text"
                  value={settings.companyAddress || ''}
                  onChange={(e) => handleSettingChange('companyAddress', e.target.value)}
                  className="w-full bg-[#120a12] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:border-[#C21875] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-white/70 block mb-1">Operating Business Hours</label>
                <input
                  type="text"
                  value={settings.businessHours || ''}
                  onChange={(e) => handleSettingChange('businessHours', e.target.value)}
                  className="w-full bg-[#120a12] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:border-[#C21875] focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: WhatsApp Automation */}
        {activeTab === 'whatsapp' && (
          <div className="space-y-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#25D366] flex items-center space-x-2">
              <MessageSquare size={15} />
              <span>WhatsApp Integration & Dynamic Message Templates</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-white/70 block mb-1">WhatsApp Number (International Format)</label>
                <input
                  type="text"
                  value={settings.whatsappNumber || ''}
                  onChange={(e) => handleSettingChange('whatsappNumber', e.target.value)}
                  placeholder="+923348012580"
                  className="w-full bg-[#120a12] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:border-[#C21875] focus:outline-none"
                />
                <span className="text-[10px] text-white/40 mt-1 block">Include country code without dashes (e.g. +923348012580)</span>
              </div>

              <div className="flex items-center pt-6">
                <label className="flex items-center space-x-2.5 bg-[#140d14] p-3.5 rounded-xl border border-white/5 cursor-pointer w-full">
                  <input
                    type="checkbox"
                    checked={settings.floatingWhatsappEnabled === 'true'}
                    onChange={(e) => handleSettingChange('floatingWhatsappEnabled', e.target.checked ? 'true' : 'false')}
                    className="rounded text-[#25D366]"
                  />
                  <span className="text-xs font-bold text-white">Enable Floating WhatsApp Button on Storefront</span>
                </label>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-white/70 block mb-1">General Greeting Message</label>
              <textarea
                rows={2}
                value={settings.whatsappGreeting || ''}
                onChange={(e) => handleSettingChange('whatsappGreeting', e.target.value)}
                className="w-full bg-[#120a12] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:border-[#C21875] focus:outline-none"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-white/70">Product Detail Inquiry Template</label>
                <span className="text-[10px] text-[#D6B36A] font-mono">Available: &#123;product_name&#125;, &#123;sku&#125;, &#123;quantity&#125;, &#123;url&#125;</span>
              </div>
              <textarea
                rows={3}
                value={settings.whatsappProductTemplate || ''}
                onChange={(e) => handleSettingChange('whatsappProductTemplate', e.target.value)}
                className="w-full bg-[#120a12] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:border-[#C21875] focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-white/70 block mb-1">Wholesale / Quote Inquiry Template</label>
              <textarea
                rows={2}
                value={settings.whatsappQuoteTemplate || ''}
                onChange={(e) => handleSettingChange('whatsappQuoteTemplate', e.target.value)}
                className="w-full bg-[#120a12] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:border-[#C21875] focus:outline-none font-mono"
              />
            </div>
          </div>
        )}

        {/* TAB 3: Business & Shipping */}
        {activeTab === 'business' && (
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#D6B36A] flex items-center space-x-2">
              <DollarSign size={15} />
              <span>Currency & Fulfillment Settings</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-semibold text-white/70 block mb-1">Currency Code</label>
                <input
                  type="text"
                  value={settings.currency || 'PKR'}
                  onChange={(e) => handleSettingChange('currency', e.target.value)}
                  placeholder="PKR, USD, EUR"
                  className="w-full bg-[#120a12] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:border-[#C21875] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-white/70 block mb-1">Currency Symbol</label>
                <input
                  type="text"
                  value={settings.currencySymbol || 'Rs.'}
                  onChange={(e) => handleSettingChange('currencySymbol', e.target.value)}
                  placeholder="Rs., $, €"
                  className="w-full bg-[#120a12] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:border-[#C21875] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-white/70 block mb-1">Sales Tax Rate (e.g. 0.05 for 5%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={settings.taxRate || '0.05'}
                  onChange={(e) => handleSettingChange('taxRate', e.target.value)}
                  className="w-full bg-[#120a12] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:border-[#C21875] focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-semibold text-white/70 block mb-1">Standard Domestic Shipping Fee</label>
                <input
                  type="number"
                  step="0.01"
                  value={settings.shippingRate || '150.00'}
                  onChange={(e) => handleSettingChange('shippingRate', e.target.value)}
                  className="w-full bg-[#120a12] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:border-[#C21875] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-white/70 block mb-1">Free Shipping Threshold</label>
                <input
                  type="number"
                  step="0.01"
                  value={settings.freeShippingThreshold || '2500.00'}
                  onChange={(e) => handleSettingChange('freeShippingThreshold', e.target.value)}
                  className="w-full bg-[#120a12] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:border-[#C21875] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-white/70 block mb-1">Global Minimum Order Qty</label>
                <input
                  type="number"
                  value={settings.minOrderQuantity || '1'}
                  onChange={(e) => handleSettingChange('minOrderQuantity', e.target.value)}
                  className="w-full bg-[#120a12] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:border-[#C21875] focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: Social Profiles */}
        {activeTab === 'social' && (
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#C21875] flex items-center space-x-2">
              <Share2 size={15} />
              <span>Social Media Profiles</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-white/70 block mb-1">Instagram URL</label>
                <input
                  type="text"
                  value={settings.instagramUrl || ''}
                  onChange={(e) => handleSettingChange('instagramUrl', e.target.value)}
                  className="w-full bg-[#120a12] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:border-[#C21875] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-white/70 block mb-1">Facebook Page URL</label>
                <input
                  type="text"
                  value={settings.facebookUrl || ''}
                  onChange={(e) => handleSettingChange('facebookUrl', e.target.value)}
                  className="w-full bg-[#120a12] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:border-[#C21875] focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-white/70 block mb-1">YouTube Channel URL</label>
                <input
                  type="text"
                  value={settings.youtubeUrl || ''}
                  onChange={(e) => handleSettingChange('youtubeUrl', e.target.value)}
                  className="w-full bg-[#120a12] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:border-[#C21875] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-white/70 block mb-1">LinkedIn Profile URL</label>
                <input
                  type="text"
                  value={settings.linkedinUrl || ''}
                  onChange={(e) => handleSettingChange('linkedinUrl', e.target.value)}
                  className="w-full bg-[#120a12] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:border-[#C21875] focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-white/70 block mb-1">TikTok URL</label>
                <input
                  type="text"
                  value={settings.tiktokUrl || ''}
                  onChange={(e) => handleSettingChange('tiktokUrl', e.target.value)}
                  className="w-full bg-[#120a12] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:border-[#C21875] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-white/70 block mb-1">Pinterest URL</label>
                <input
                  type="text"
                  value={settings.pinterestUrl || ''}
                  onChange={(e) => handleSettingChange('pinterestUrl', e.target.value)}
                  className="w-full bg-[#120a12] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:border-[#C21875] focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* Form Submit Strip */}
        <div className="pt-4 border-t border-white/5 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {autoSaveStatus === 'saving' || saving ? (
              <span className="text-xs text-amber-400 font-bold flex items-center space-x-1.5 font-mono">
                <Loader2 size={13} className="animate-spin" />
                <span>Auto-saving live changes...</span>
              </span>
            ) : autoSaveStatus === 'saved' || savedSuccess ? (
              <span className="text-xs text-emerald-400 font-bold flex items-center space-x-1.5 font-mono">
                <Check size={14} />
                <span>All changes auto-saved real-time! Active across website.</span>
              </span>
            ) : (
              <span className="text-xs text-white/40 font-mono">
                ⚡ Realtime Auto-Save is active.
              </span>
            )}
          </div>

          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-white bg-[#C21875] hover:bg-[#A31260] shadow-lg shadow-[#C21875]/25 transition-all flex items-center space-x-1.5 cursor-pointer"
          >
            {saving && <Loader2 size={13} className="animate-spin" />}
            <span>Save All Settings Now</span>
          </button>
        </div>

      </form>

    </div>
  );
}
