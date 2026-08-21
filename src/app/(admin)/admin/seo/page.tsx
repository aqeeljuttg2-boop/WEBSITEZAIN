'use client';

import React, { useEffect, useState } from 'react';
import { 
  Globe, Sparkles, Check, Loader2, Search, ExternalLink, 
  Share2, ShieldCheck, RefreshCcw
} from 'lucide-react';

export default function AdminSeoPage() {
  const [seo, setSeo] = useState<Record<string, string>>({
    seoTitle: '',
    seoDescription: '',
    seoKeywords: '',
    ogImage: '',
    faviconUrl: '',
    robotsIndex: 'index, follow',
    googleSiteVerification: '',
    facebookPixelId: '',
    googleAnalyticsId: '',
    twitterHandle: ''
  });
  const [stats, setStats] = useState<any>({ indexedProducts: 0, indexedCategories: 0, indexedPages: 0 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const loadSeo = async () => {
    try {
      const res = await fetch('/api/admin/seo', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setSeo(prev => ({ ...prev, ...(data.seoSettings || {}) }));
        setStats(data.stats || {});
      }
    } catch (e) {
      console.error('Load SEO error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSeo();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);

    try {
      const res = await fetch('/api/admin/seo', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(seo)
      });

      if (res.ok) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
      }
    } catch (e) {
      console.error('Save SEO error:', e);
    } finally {
      setSaving(false);
    }
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
      
      {/* 1. Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Global SEO Management</h1>
          <p className="text-xs text-white/50 mt-1">
            Configure global meta tags, OpenGraph social sharing preview, Google search snippet, and robots indexing.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <a
            href="/sitemap.xml"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-white/5 hover:bg-white/10 text-[#D6B36A] hover:text-white border border-white/5 flex items-center space-x-1.5 transition-all"
          >
            <ExternalLink size={13} />
            <span>View XML Sitemap</span>
          </a>
        </div>
      </div>

      {/* 2. SEO Indexing KPI Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#191019] border border-white/5 p-4 rounded-2xl">
          <p className="text-[10px] font-mono uppercase text-white/40">Search Indexed Products</p>
          <p className="text-2xl font-bold text-white font-mono mt-1">{stats.indexedProducts}</p>
        </div>
        <div className="bg-[#191019] border border-white/5 p-4 rounded-2xl">
          <p className="text-[10px] font-mono uppercase text-white/40">Search Indexed Categories</p>
          <p className="text-2xl font-bold text-white font-mono mt-1">{stats.indexedCategories}</p>
        </div>
        <div className="bg-[#191019] border border-white/5 p-4 rounded-2xl">
          <p className="text-[10px] font-mono uppercase text-white/40">Static & Policy Pages</p>
          <p className="text-2xl font-bold text-white font-mono mt-1">{stats.indexedPages}</p>
        </div>
      </div>

      {/* 3. Live Google Search Preview Card */}
      <div className="bg-[#191019] border border-white/5 p-5 rounded-2xl space-y-2">
        <span className="text-[10px] font-mono uppercase text-[#D6B36A] font-bold block">
          Google Search SERP Preview
        </span>
        <div className="bg-white p-4 rounded-xl space-y-1 shadow-inner">
          <p className="text-xs text-[#202124] font-mono truncate">https://lashtweezerslounge.com</p>
          <h3 className="text-base text-[#1a0dab] font-medium hover:underline cursor-pointer truncate">
            {seo.seoTitle || 'Lash Tweezers Lounge | Handcrafted Lash Tweezers & Shears'}
          </h3>
          <p className="text-xs text-[#4d5156] line-clamp-2 leading-relaxed">
            {seo.seoDescription || 'Premium export-quality eyelash extension tweezers, volume lash clamps, barber shears, cuticle nippers, and grooming kits from Lash Tweezers Lounge Sialkot.'}
          </p>
        </div>
      </div>

      {/* 4. SEO Settings Form */}
      <form onSubmit={handleSave} className="bg-[#191019] border border-white/5 p-6 rounded-2xl space-y-6">
        
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#C21875] flex items-center space-x-2">
            <Globe size={15} />
            <span>Global Meta Tags</span>
          </h3>

          <div>
            <label className="text-xs font-semibold text-white/70 block mb-1">Global Website Title</label>
            <input
              type="text"
              value={seo.seoTitle || ''}
              onChange={(e) => setSeo({ ...seo, seoTitle: e.target.value })}
              className="w-full bg-[#120a12] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:border-[#C21875] focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-white/70 block mb-1">Global Meta Description</label>
            <textarea
              rows={3}
              value={seo.seoDescription || ''}
              onChange={(e) => setSeo({ ...seo, seoDescription: e.target.value })}
              className="w-full bg-[#120a12] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:border-[#C21875] focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-white/70 block mb-1">Default Meta Keywords (Comma separated)</label>
            <input
              type="text"
              value={seo.seoKeywords || ''}
              onChange={(e) => setSeo({ ...seo, seoKeywords: e.target.value })}
              className="w-full bg-[#120a12] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:border-[#C21875] focus:outline-none"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-white/5 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#D6B36A] flex items-center space-x-2">
            <Share2 size={15} />
            <span>OpenGraph & Social Sharing</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-white/70 block mb-1">OpenGraph Share Image URL</label>
              <input
                type="text"
                value={seo.ogImage || ''}
                onChange={(e) => setSeo({ ...seo, ogImage: e.target.value })}
                placeholder="/icon.png"
                className="w-full bg-[#120a12] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:border-[#C21875] focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-white/70 block mb-1">Favicon URL</label>
              <input
                type="text"
                value={seo.faviconUrl || ''}
                onChange={(e) => setSeo({ ...seo, faviconUrl: e.target.value })}
                placeholder="/icon.png"
                className="w-full bg-[#120a12] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:border-[#C21875] focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-white/70 block mb-1">Robots.txt Indexing Directive</label>
              <select
                value={seo.robotsIndex || 'index, follow'}
                onChange={(e) => setSeo({ ...seo, robotsIndex: e.target.value })}
                className="w-full bg-[#120a12] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:border-[#C21875] focus:outline-none"
              >
                <option value="index, follow">index, follow (Recommended for public search visibility)</option>
                <option value="noindex, nofollow">noindex, nofollow (Private staging / hidden)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-white/70 block mb-1">Google Site Verification Code</label>
              <input
                type="text"
                value={seo.googleSiteVerification || ''}
                onChange={(e) => setSeo({ ...seo, googleSiteVerification: e.target.value })}
                placeholder="google-site-verification=..."
                className="w-full bg-[#120a12] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:border-[#C21875] focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-white/5 flex items-center justify-between">
          {savedSuccess && (
            <span className="text-xs text-emerald-400 font-bold flex items-center space-x-1.5">
              <Check size={14} />
              <span>SEO settings updated successfully!</span>
            </span>
          )}

          <button
            type="submit"
            disabled={saving}
            className="ml-auto px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-white bg-[#C21875] hover:bg-[#A31260] shadow-lg shadow-[#C21875]/25 transition-all flex items-center space-x-1.5"
          >
            {saving && <Loader2 size={13} className="animate-spin" />}
            <span>Save SEO Settings</span>
          </button>
        </div>

      </form>

    </div>
  );
}
