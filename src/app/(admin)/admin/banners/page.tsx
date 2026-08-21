'use client';

import React, { useEffect, useState } from 'react';
import { 
  ImageIcon, Plus, Search, Trash2, Edit, Upload, 
  X, Loader2, Sparkles, Calendar, ArrowUpDown, ExternalLink
} from 'lucide-react';
import Image from 'next/image';

interface BannerItem {
  id: string;
  title: string;
  subtitle?: string | null;
  badge?: string | null;
  buttonText?: string | null;
  buttonUrl?: string | null;
  secondaryButtonText?: string | null;
  secondaryButtonUrl?: string | null;
  desktopImage?: string | null;
  mobileImage?: string | null;
  position: string;
  startDate?: string | null;
  endDate?: string | null;
  isActive: boolean;
  orderIndex: number;
}

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<BannerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [positionFilter, setPositionFilter] = useState('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<BannerItem | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [badge, setBadge] = useState('');
  const [buttonText, setButtonText] = useState('');
  const [buttonUrl, setButtonUrl] = useState('');
  const [secondaryButtonText, setSecondaryButtonText] = useState('');
  const [secondaryButtonUrl, setSecondaryButtonUrl] = useState('');
  const [desktopImage, setDesktopImage] = useState('');
  const [mobileImage, setMobileImage] = useState('');
  const [position, setPosition] = useState('HERO_SLIDER');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [orderIndex, setOrderIndex] = useState('0');

  const [uploading, setUploading] = useState(false);

  const loadBanners = async () => {
    try {
      const res = await fetch('/api/admin/banners?all=true', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setBanners(data.banners || []);
      }
    } catch (e) {
      console.error('Load banners error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBanners();
  }, []);

  const openAddModal = () => {
    setEditingBanner(null);
    setTitle('');
    setSubtitle('');
    setBadge('');
    setButtonText('');
    setButtonUrl('');
    setSecondaryButtonText('');
    setSecondaryButtonUrl('');
    setDesktopImage('');
    setMobileImage('');
    setPosition('HERO_SLIDER');
    setStartDate('');
    setEndDate('');
    setIsActive(true);
    setOrderIndex('0');
    setIsModalOpen(true);
  };

  const openEditModal = (b: BannerItem) => {
    setEditingBanner(b);
    setTitle(b.title);
    setSubtitle(b.subtitle || '');
    setBadge(b.badge || '');
    setButtonText(b.buttonText || '');
    setButtonUrl(b.buttonUrl || '');
    setSecondaryButtonText(b.secondaryButtonText || '');
    setSecondaryButtonUrl(b.secondaryButtonUrl || '');
    setDesktopImage(b.desktopImage || '');
    setMobileImage(b.mobileImage || '');
    setPosition(b.position || 'HERO_SLIDER');
    setStartDate(b.startDate ? new Date(b.startDate).toISOString().slice(0, 10) : '');
    setEndDate(b.endDate ? new Date(b.endDate).toISOString().slice(0, 10) : '');
    setIsActive(b.isActive);
    setOrderIndex(b.orderIndex !== undefined ? b.orderIndex.toString() : '0');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const payload = {
      title: title.trim(),
      subtitle: subtitle.trim() || null,
      badge: badge.trim() || null,
      buttonText: buttonText.trim() || null,
      buttonUrl: buttonUrl.trim() || null,
      secondaryButtonText: secondaryButtonText.trim() || null,
      secondaryButtonUrl: secondaryButtonUrl.trim() || null,
      desktopImage: desktopImage.trim() || null,
      mobileImage: mobileImage.trim() || desktopImage.trim() || null,
      position,
      startDate: startDate || null,
      endDate: endDate || null,
      isActive,
      orderIndex: parseInt(orderIndex, 10) || 0
    };

    try {
      let res;
      if (editingBanner) {
        res = await fetch(`/api/admin/banners/${editingBanner.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch('/api/admin/banners', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      if (res.ok) {
        setIsModalOpen(false);
        loadBanners();
      }
    } catch (e) {
      console.error('Save banner error:', e);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, isMobile = false) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', files[0]);

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      if (res.ok) {
        const data = await res.json();
        const url = data.url || data.urls[0];
        if (isMobile) setMobileImage(url);
        else setDesktopImage(url);
      }
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this banner?')) return;
    try {
      await fetch(`/api/admin/banners/${id}`, { method: 'DELETE' });
      loadBanners();
    } catch (e) {
      console.error('Delete error:', e);
    }
  };

  const filtered = banners.filter(b => 
    positionFilter === 'ALL' || b.position === positionFilter
  );

  return (
    <div className="space-y-6">
      
      {/* 1. Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Banner Management</h1>
          <p className="text-xs text-white/50 mt-1">
            Manage hero sliders, promotional strips, and middle promotional banners across your storefront.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="bg-[#C21875] hover:bg-[#A31260] text-white px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5 shadow-lg shadow-[#C21875]/25 transition-all"
        >
          <Plus size={16} />
          <span>Add New Banner</span>
        </button>
      </div>

      {/* 2. Position Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 bg-[#191019] p-3 rounded-2xl border border-white/5">
        <span className="text-xs font-mono text-white/40 uppercase font-bold mr-2">Position:</span>
        {['ALL', 'HERO_SLIDER', 'PROMO_STRIP', 'MIDDLE_BANNER', 'FOOTER_BANNER', 'POPUP'].map(pos => (
          <button
            key={pos}
            onClick={() => setPositionFilter(pos)}
            className={`text-xs font-bold px-3 py-1.5 rounded-xl uppercase font-mono transition-colors ${
              positionFilter === pos
                ? 'bg-[#C21875] text-white shadow-sm'
                : 'bg-white/5 text-white/60 hover:bg-white/10'
            }`}
          >
            {pos.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* 3. Banners Grid */}
      {loading ? (
        <div className="min-h-[250px] flex items-center justify-center text-white">
          <Loader2 size={32} className="animate-spin text-[#C21875]" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.length === 0 ? (
            <div className="col-span-full bg-[#191019] border border-white/5 p-12 text-center rounded-2xl text-white/40 italic">
              No banners found in this position. Click "Add New Banner" to create one.
            </div>
          ) : (
            filtered.map((b) => (
              <div 
                key={b.id}
                className="bg-[#191019] border border-white/5 rounded-2xl overflow-hidden hover:border-[#C21875]/40 transition-all flex flex-col justify-between shadow-xl"
              >
                <div>
                  {/* Banner Image Preview */}
                  <div className="w-full h-44 bg-[#120a12] border-b border-white/5 overflow-hidden relative flex items-center justify-center">
                    {b.desktopImage ? (
                      <Image src={b.desktopImage} alt={b.title} fill sizes="400px" className="object-cover" />
                    ) : (
                      <ImageIcon size={32} className="text-white/20" />
                    )}
                    <span className="absolute top-3 left-3 px-2 py-0.5 rounded bg-black/70 backdrop-blur-sm text-[10px] font-bold font-mono text-[#D6B36A]">
                      {b.position}
                    </span>
                    <span className={`absolute top-3 right-3 px-2 py-0.5 rounded text-[9px] font-bold font-mono ${
                      b.isActive ? 'bg-emerald-500/80 text-white' : 'bg-red-500/80 text-white'
                    }`}>
                      {b.isActive ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </div>

                  <div className="p-5 space-y-2">
                    {b.badge && (
                      <span className="text-[10px] font-bold text-[#C21875] uppercase tracking-wider block font-mono">
                        {b.badge}
                      </span>
                    )}
                    <h3 className="font-bold text-sm text-white">{b.title}</h3>
                    <p className="text-xs text-white/50 line-clamp-2">{b.subtitle || 'No subtitle provided.'}</p>
                    
                    {b.buttonText && (
                      <div className="pt-1 text-[11px] text-[#D6B36A] font-mono">
                        Button: <span className="text-white">{b.buttonText}</span> → {b.buttonUrl}
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-4 border-t border-white/5 bg-[#140d14] flex items-center justify-between text-xs">
                  <span className="text-[10px] text-white/40 font-mono">Order: #{b.orderIndex}</span>
                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() => openEditModal(b)}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white"
                      title="Edit banner"
                    >
                      <Edit size={13} />
                    </button>
                    <button
                      onClick={() => handleDelete(b.id)}
                      className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400"
                      title="Delete banner"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* 4. MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#191019] border border-white/10 w-full max-w-xl max-h-[90vh] rounded-3xl overflow-hidden shadow-2xl flex flex-col">
            <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-[#140d14]">
              <h3 className="text-sm font-bold text-white">{editingBanner ? 'Edit Banner' : 'Create Banner'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-white/60 hover:text-white"><X size={18} /></button>
            </div>

            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-white/70 block mb-1">Banner Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. 50% OFF VOLUMIZING LASH TWEEZERS"
                  className="w-full bg-[#120a12] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:border-[#C21875] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-white/70 block mb-1">Badge Tag</label>
                  <input
                    type="text"
                    value={badge}
                    onChange={(e) => setBadge(e.target.value)}
                    placeholder="e.g. LIMITED OFFER"
                    className="w-full bg-[#120a12] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-[#C21875] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-white/70 block mb-1">Placement Position</label>
                  <select
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    className="w-full bg-[#120a12] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-[#C21875] focus:outline-none"
                  >
                    <option value="HERO_SLIDER">Hero Slider</option>
                    <option value="PROMO_STRIP">Promo Strip</option>
                    <option value="MIDDLE_BANNER">Middle Promo Banner</option>
                    <option value="FOOTER_BANNER">Footer Banner</option>
                    <option value="POPUP">Popup Modal</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-white/70 block mb-1">Desktop Image URL</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={desktopImage}
                    onChange={(e) => setDesktopImage(e.target.value)}
                    placeholder="/catagori/..."
                    className="flex-1 bg-[#120a12] border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-[#C21875] focus:outline-none"
                  />
                  <label className="bg-white/5 hover:bg-white/10 px-3 py-2 rounded-xl text-xs font-bold text-white cursor-pointer transition-colors">
                    Upload
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleUpload(e, false)} />
                  </label>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-white/70 block mb-1">Mobile Image URL (Optional)</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={mobileImage}
                    onChange={(e) => setMobileImage(e.target.value)}
                    placeholder="Same as desktop if blank"
                    className="flex-1 bg-[#120a12] border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-[#C21875] focus:outline-none"
                  />
                  <label className="bg-white/5 hover:bg-white/10 px-3 py-2 rounded-xl text-xs font-bold text-white cursor-pointer transition-colors">
                    Upload
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleUpload(e, true)} />
                  </label>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-white/70 block mb-1">Subtitle / Details</label>
                <textarea
                  rows={2}
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  className="w-full bg-[#120a12] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:border-[#C21875] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-white/70 block mb-1">Button Text</label>
                  <input
                    type="text"
                    value={buttonText}
                    onChange={(e) => setButtonText(e.target.value)}
                    placeholder="Shop Collection"
                    className="w-full bg-[#120a12] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-white/70 block mb-1">Button URL</label>
                  <input
                    type="text"
                    value={buttonUrl}
                    onChange={(e) => setButtonUrl(e.target.value)}
                    placeholder="/shop?category=..."
                    className="w-full bg-[#120a12] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-white/70 block mb-1">Order Index</label>
                  <input
                    type="number"
                    value={orderIndex}
                    onChange={(e) => setOrderIndex(e.target.value)}
                    placeholder="0"
                    className="w-full bg-[#120a12] border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono"
                  />
                </div>
                <div className="flex items-center pt-5">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="rounded text-[#C21875]"
                    />
                    <span className="text-xs text-white">Active Banner</span>
                  </label>
                </div>
              </div>

              <div className="pt-4 border-t border-white/5 flex items-center justify-end space-x-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-xl text-xs font-semibold text-white/60 bg-white/5">
                  Cancel
                </button>
                <button type="submit" className="px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-wider text-white bg-[#C21875] hover:bg-[#A31260]">
                  Save Banner
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
