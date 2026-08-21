'use client';

import React, { useEffect, useState } from 'react';
import { 
  Layout, Eye, MoveUp, MoveDown, Check, X, Edit, 
  Plus, Trash2, Image as ImageIcon, Sparkles, Loader2,
  Sliders, ExternalLink, RefreshCcw, Zap
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRealtime } from '@/context/RealtimeContext';

interface SectionItem {
  id: string;
  sectionKey: string;
  title: string;
  subtitle?: string | null;
  badge?: string | null;
  content?: string | null;
  buttonText?: string | null;
  buttonUrl?: string | null;
  imageUrl?: string | null;
  isEnabled: boolean;
  orderIndex: number;
}

interface HeroSlideItem {
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
  isActive: boolean;
  orderIndex: number;
}

export default function AdminHomepageManagerPage() {
  const [sections, setSections] = useState<SectionItem[]>([]);
  const [heroSlides, setHeroSlides] = useState<HeroSlideItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingOrder, setSavingOrder] = useState(false);

  // Active view tab: 'sections' or 'hero'
  const [activeTab, setActiveTab] = useState<'sections' | 'hero'>('sections');

  // Edit Section Modal
  const [editingSection, setEditingSection] = useState<SectionItem | null>(null);
  const [secTitle, setSecTitle] = useState('');
  const [secSubtitle, setSecSubtitle] = useState('');
  const [secBadge, setSecBadge] = useState('');
  const [secBtnText, setSecBtnText] = useState('');
  const [secBtnUrl, setSecBtnUrl] = useState('');
  const [secImageUrl, setSecImageUrl] = useState('');

  // Hero Slide Modal
  const [isSlideModalOpen, setIsSlideModalOpen] = useState(false);
  const [editingSlide, setEditingSlide] = useState<HeroSlideItem | null>(null);
  const [slideTitle, setSlideTitle] = useState('');
  const [slideSubtitle, setSlideSubtitle] = useState('');
  const [slideBadge, setSlideBadge] = useState('');
  const [slideBtnText, setSlideBtnText] = useState('');
  const [slideBtnUrl, setSlideBtnUrl] = useState('');
  const [slideSecBtnText, setSlideSecBtnText] = useState('');
  const [slideSecBtnUrl, setSlideSecBtnUrl] = useState('');
  const [slideDesktopImage, setSlideDesktopImage] = useState('');
  const [slideMobileImage, setSlideMobileImage] = useState('');
  const [slideActive, setSlideActive] = useState(true);

  const loadHomepageData = async () => {
    try {
      const res = await fetch('/api/admin/homepage', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setSections(data.sections || []);
        setHeroSlides(data.heroSlides || []);
      }
    } catch (e) {
      console.error('Load homepage error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHomepageData();
  }, []);

  // Real-time live auto-refresh
  useRealtime('HOMEPAGE_UPDATED', () => {
    loadHomepageData();
  });

  // Section Ordering
  const moveSection = async (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) || 
      (direction === 'down' && index === sections.length - 1)
    ) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const copy = [...sections];
    const item = copy[index];
    copy[index] = copy[targetIndex];
    copy[targetIndex] = item;

    setSections(copy);
    setSavingOrder(true);

    try {
      await fetch('/api/admin/homepage', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reorder_sections', sections: copy })
      });
    } catch (e) {
      console.error('Reorder error:', e);
    } finally {
      setSavingOrder(false);
    }
  };

  // Toggle Section Visibility
  const toggleSection = async (sec: SectionItem) => {
    try {
      const res = await fetch('/api/admin/homepage', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle_section', id: sec.id })
      });
      if (res.ok) {
        setSections(sections.map(s => s.id === sec.id ? { ...s, isEnabled: !s.isEnabled } : s));
      }
    } catch (e) {
      console.error('Toggle error:', e);
    }
  };

  // Open Edit Section Modal
  const openEditSectionModal = (sec: SectionItem) => {
    setEditingSection(sec);
    setSecTitle(sec.title);
    setSecSubtitle(sec.subtitle || '');
    setSecBadge(sec.badge || '');
    setSecBtnText(sec.buttonText || '');
    setSecBtnUrl(sec.buttonUrl || '');
    setSecImageUrl(sec.imageUrl || '');
  };

  const handleSaveSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSection) return;

    try {
      const res = await fetch('/api/admin/homepage', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingSection.id,
          title: secTitle,
          subtitle: secSubtitle,
          badge: secBadge,
          buttonText: secBtnText,
          buttonUrl: secBtnUrl,
          imageUrl: secImageUrl
        })
      });

      if (res.ok) {
        setEditingSection(null);
        loadHomepageData();
      }
    } catch (e) {
      console.error('Save section error:', e);
    }
  };

  // Hero Slide Management
  const openAddSlideModal = () => {
    setEditingSlide(null);
    setSlideTitle('');
    setSlideSubtitle('');
    setSlideBadge('');
    setSlideBtnText('Shop Now');
    setSlideBtnUrl('/shop');
    setSlideSecBtnText('Download Catalog');
    setSlideSecBtnUrl('/catalog');
    setSlideDesktopImage('');
    setSlideMobileImage('');
    setSlideActive(true);
    setIsSlideModalOpen(true);
  };

  const openEditSlideModal = (slide: HeroSlideItem) => {
    setEditingSlide(slide);
    setSlideTitle(slide.title);
    setSlideSubtitle(slide.subtitle || '');
    setSlideBadge(slide.badge || '');
    setSlideBtnText(slide.buttonText || '');
    setSlideBtnUrl(slide.buttonUrl || '');
    setSlideSecBtnText(slide.secondaryButtonText || '');
    setSlideSecBtnUrl(slide.secondaryButtonUrl || '');
    setSlideDesktopImage(slide.desktopImage || '');
    setSlideMobileImage(slide.mobileImage || '');
    setSlideActive(slide.isActive);
    setIsSlideModalOpen(true);
  };

  const handleSaveSlide = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slideTitle.trim()) return;

    const payload = {
      title: slideTitle.trim(),
      subtitle: slideSubtitle.trim() || null,
      badge: slideBadge.trim() || null,
      buttonText: slideBtnText.trim() || null,
      buttonUrl: slideBtnUrl.trim() || null,
      secondaryButtonText: slideSecBtnText.trim() || null,
      secondaryButtonUrl: slideSecBtnUrl.trim() || null,
      desktopImage: slideDesktopImage.trim() || null,
      mobileImage: slideMobileImage.trim() || slideDesktopImage.trim() || null,
      position: 'HERO_SLIDER',
      isActive: slideActive,
    };

    try {
      let res;
      if (editingSlide) {
        res = await fetch(`/api/admin/banners/${editingSlide.id}`, {
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
        setIsSlideModalOpen(false);
        loadHomepageData();
      }
    } catch (e) {
      console.error('Slide save error:', e);
    }
  };

  const handleDeleteSlide = async (id: string) => {
    if (!confirm('Are you sure you want to delete this hero slide?')) return;
    try {
      await fetch(`/api/admin/banners/${id}`, { method: 'DELETE' });
      loadHomepageData();
    } catch (e) {
      console.error('Delete slide error:', e);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Homepage Manager</h1>
          <p className="text-xs text-white/50 mt-1">
            Reorder homepage sections, toggle visibility, and customize hero slider slides without touching code.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            href="/"
            target="_blank"
            className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-white/5 hover:bg-white/10 text-[#D6B36A] hover:text-white border border-white/5 flex items-center space-x-1.5 transition-all"
          >
            <ExternalLink size={13} />
            <span>Preview Live Home</span>
          </Link>
        </div>
      </div>

      {/* 2. Top Tabs */}
      <div className="flex border-b border-white/5 bg-[#191019] p-2 rounded-2xl space-x-2">
        <button
          onClick={() => setActiveTab('sections')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center space-x-2 ${
            activeTab === 'sections'
              ? 'bg-[#C21875] text-white shadow-md'
              : 'text-white/60 hover:text-white hover:bg-white/5'
          }`}
        >
          <Layout size={15} />
          <span>Homepage Sections Order & Toggles</span>
        </button>

        <button
          onClick={() => setActiveTab('hero')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center space-x-2 ${
            activeTab === 'hero'
              ? 'bg-[#C21875] text-white shadow-md'
              : 'text-white/60 hover:text-white hover:bg-white/5'
          }`}
        >
          <Sliders size={15} />
          <span>Hero Slider Slides Manager ({heroSlides.length})</span>
        </button>
      </div>

      {/* 3. TAB 1: Sections Ordering & Toggles */}
      {activeTab === 'sections' && (
        <div className="space-y-4">
          <div className="bg-[#191019] border border-white/5 p-4 rounded-2xl flex items-center justify-between">
            <span className="text-xs font-semibold text-white/70">
              Arrange the vertical display order of your homepage. Changes reflect instantly on the storefront.
            </span>
            {savingOrder && (
              <span className="text-xs text-[#D6B36A] font-mono flex items-center space-x-1">
                <Loader2 size={12} className="animate-spin" />
                <span>Saving order...</span>
              </span>
            )}
          </div>

          <div className="space-y-2.5">
            {sections.map((sec, idx) => (
              <div
                key={sec.id}
                className={`bg-[#191019] border rounded-2xl p-4 flex items-center justify-between transition-all ${
                  sec.isEnabled ? 'border-white/10' : 'border-white/5 opacity-50 bg-[#140d14]'
                }`}
              >
                {/* Order Index & Section Details */}
                <div className="flex items-center space-x-4">
                  <span className="w-8 h-8 rounded-xl bg-[#120a12] border border-white/10 flex items-center justify-center text-xs font-mono font-bold text-[#D6B36A]">
                    {idx + 1}
                  </span>

                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="font-bold text-sm text-white">{sec.title}</h4>
                      <span className="text-[10px] font-mono text-[#C21875] bg-[#C21875]/10 px-2 py-0.5 rounded font-bold">
                        {sec.sectionKey}
                      </span>
                    </div>
                    <p className="text-xs text-white/40 mt-0.5 max-w-xl truncate">
                      {sec.subtitle || 'Standard storefront component'}
                    </p>
                  </div>
                </div>

                {/* Section Controls */}
                <div className="flex items-center space-x-2">
                  {/* Up / Down arrows */}
                  <div className="flex items-center space-x-1 mr-2">
                    <button
                      onClick={() => moveSection(idx, 'up')}
                      disabled={idx === 0}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-20 text-white"
                      title="Move up"
                    >
                      <MoveUp size={14} />
                    </button>
                    <button
                      onClick={() => moveSection(idx, 'down')}
                      disabled={idx === sections.length - 1}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-20 text-white"
                      title="Move down"
                    >
                      <MoveDown size={14} />
                    </button>
                  </div>

                  {/* Edit button */}
                  <button
                    onClick={() => openEditSectionModal(sec)}
                    className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white text-xs font-bold flex items-center space-x-1"
                  >
                    <Edit size={13} />
                    <span>Edit Content</span>
                  </button>

                  {/* Enable / Disable Toggle */}
                  <button
                    onClick={() => toggleSection(sec)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      sec.isEnabled
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-white/5 text-white/40'
                    }`}
                  >
                    {sec.isEnabled ? 'Enabled' : 'Disabled'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. TAB 2: Hero Slider Manager */}
      {activeTab === 'hero' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-white/50">
              Configure multiple slides for the animated hero slider on your homepage.
            </p>
            <button
              onClick={openAddSlideModal}
              className="bg-[#C21875] hover:bg-[#A31260] text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5 shadow-md"
            >
              <Plus size={15} />
              <span>Add Hero Slide</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {heroSlides.map((slide, idx) => (
              <div 
                key={slide.id}
                className="bg-[#191019] border border-white/5 rounded-2xl p-5 space-y-4 hover:border-[#C21875]/30 transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-[#D6B36A]">Slide {idx + 1}</span>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase font-mono ${
                      slide.isActive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/5 text-white/40'
                    }`}>
                      {slide.isActive ? 'Active' : 'Disabled'}
                    </span>
                  </div>

                  {slide.desktopImage && (
                    <div className="w-full h-36 rounded-xl bg-[#120a12] border border-white/10 overflow-hidden relative">
                      <Image src={slide.desktopImage} alt={slide.title} fill sizes="300px" className="object-cover" />
                    </div>
                  )}

                  <div>
                    {slide.badge && (
                      <span className="text-[10px] font-bold text-[#C21875] uppercase tracking-wider block font-mono">
                        {slide.badge}
                      </span>
                    )}
                    <h3 className="font-bold text-sm text-white mt-1">{slide.title}</h3>
                    <p className="text-xs text-white/50 mt-1 line-clamp-2">{slide.subtitle}</p>
                  </div>

                  <div className="flex items-center space-x-2 text-[11px] text-[#D6B36A] font-mono">
                    <span>CTA 1: {slide.buttonText || 'None'}</span>
                    <span>•</span>
                    <span>CTA 2: {slide.secondaryButtonText || 'None'}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-white/5 flex items-center justify-end space-x-2">
                  <button
                    onClick={() => openEditSlideModal(slide)}
                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white"
                    title="Edit slide"
                  >
                    <Edit size={14} />
                  </button>
                  <button
                    onClick={() => handleDeleteSlide(slide.id)}
                    className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400"
                    title="Delete slide"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. EDIT SECTION CONTENT MODAL */}
      {editingSection && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#191019] border border-white/10 w-full max-w-xl rounded-3xl overflow-hidden shadow-2xl flex flex-col">
            <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-[#140d14]">
              <div>
                <h3 className="text-sm font-bold text-white">Edit Section: {editingSection.title}</h3>
                <span className="text-[10px] text-[#C21875] font-mono">{editingSection.sectionKey}</span>
              </div>
              <button onClick={() => setEditingSection(null)} className="text-white/60 hover:text-white"><X size={18} /></button>
            </div>

            <form onSubmit={handleSaveSection} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-white/70 block mb-1">Section Title</label>
                <input
                  type="text"
                  required
                  value={secTitle}
                  onChange={(e) => setSecTitle(e.target.value)}
                  className="w-full bg-[#120a12] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:border-[#C21875] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-white/70 block mb-1">Badge Tag</label>
                <input
                  type="text"
                  value={secBadge}
                  onChange={(e) => setSecBadge(e.target.value)}
                  placeholder="e.g. GENERATIONAL FORGING"
                  className="w-full bg-[#120a12] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:border-[#C21875] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-white/70 block mb-1">Subtitle / Descriptive Text</label>
                <textarea
                  rows={3}
                  value={secSubtitle}
                  onChange={(e) => setSecSubtitle(e.target.value)}
                  className="w-full bg-[#120a12] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:border-[#C21875] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-white/70 block mb-1">Button Text</label>
                  <input
                    type="text"
                    value={secBtnText}
                    onChange={(e) => setSecBtnText(e.target.value)}
                    placeholder="e.g. Browse Shears"
                    className="w-full bg-[#120a12] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:border-[#C21875] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-white/70 block mb-1">Button URL</label>
                  <input
                    type="text"
                    value={secBtnUrl}
                    onChange={(e) => setSecBtnUrl(e.target.value)}
                    placeholder="e.g. /shop?category=hair-styling-shears"
                    className="w-full bg-[#120a12] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:border-[#C21875] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-white/70 block mb-1">Feature / Background Image URL</label>
                <input
                  type="text"
                  value={secImageUrl}
                  onChange={(e) => setSecImageUrl(e.target.value)}
                  placeholder="/catagori/..."
                  className="w-full bg-[#120a12] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:border-[#C21875] focus:outline-none"
                />
              </div>

              <div className="pt-4 border-t border-white/5 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setEditingSection(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-white/60 bg-white/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-wider text-white bg-[#C21875] hover:bg-[#A31260]"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. HERO SLIDE MODAL */}
      {isSlideModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#191019] border border-white/10 w-full max-w-xl rounded-3xl overflow-hidden shadow-2xl flex flex-col">
            <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-[#140d14]">
              <h3 className="text-sm font-bold text-white">{editingSlide ? 'Edit Hero Slide' : 'Add Hero Slide'}</h3>
              <button onClick={() => setIsSlideModalOpen(false)} className="text-white/60 hover:text-white"><X size={18} /></button>
            </div>

            <form onSubmit={handleSaveSlide} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-white/70 block mb-1">Slide Heading *</label>
                <input
                  type="text"
                  required
                  value={slideTitle}
                  onChange={(e) => setSlideTitle(e.target.value)}
                  placeholder="e.g. LASH TWEEZERS & ISOLATION CLAMPS"
                  className="w-full bg-[#120a12] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:border-[#C21875] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-white/70 block mb-1">Badge Tag</label>
                  <input
                    type="text"
                    value={slideBadge}
                    onChange={(e) => setSlideBadge(e.target.value)}
                    placeholder="e.g. PREMIUM BEAUTY INSTRUMENTS"
                    className="w-full bg-[#120a12] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:border-[#C21875] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-white/70 block mb-1">Desktop Image URL</label>
                  <input
                    type="text"
                    value={slideDesktopImage}
                    onChange={(e) => setSlideDesktopImage(e.target.value)}
                    placeholder="/catagori/..."
                    className="w-full bg-[#120a12] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:border-[#C21875] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-white/70 block mb-1">Subtitle</label>
                <textarea
                  rows={2}
                  value={slideSubtitle}
                  onChange={(e) => setSlideSubtitle(e.target.value)}
                  className="w-full bg-[#120a12] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:border-[#C21875] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-white/70 block mb-1">Primary CTA Button</label>
                  <input
                    type="text"
                    value={slideBtnText}
                    onChange={(e) => setSlideBtnText(e.target.value)}
                    placeholder="Shop Eyelash Tweezers"
                    className="w-full bg-[#120a12] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-white/70 block mb-1">Primary Button URL</label>
                  <input
                    type="text"
                    value={slideBtnUrl}
                    onChange={(e) => setSlideBtnUrl(e.target.value)}
                    placeholder="/shop?category=eyelash-tweezers"
                    className="w-full bg-[#120a12] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-white/70 block mb-1">Secondary CTA Button</label>
                  <input
                    type="text"
                    value={slideSecBtnText}
                    onChange={(e) => setSlideSecBtnText(e.target.value)}
                    placeholder="Download Catalog"
                    className="w-full bg-[#120a12] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-white/70 block mb-1">Secondary Button URL</label>
                  <input
                    type="text"
                    value={slideSecBtnUrl}
                    onChange={(e) => setSlideSecBtnUrl(e.target.value)}
                    placeholder="/catalog"
                    className="w-full bg-[#120a12] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="slideActive"
                  checked={slideActive}
                  onChange={(e) => setSlideActive(e.target.checked)}
                  className="rounded text-[#C21875]"
                />
                <label htmlFor="slideActive" className="text-xs text-white cursor-pointer">
                  Active (Show in hero slider autoplay)
                </label>
              </div>

              <div className="pt-4 border-t border-white/5 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsSlideModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-white/60 bg-white/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-wider text-white bg-[#C21875] hover:bg-[#A31260]"
                >
                  Save Slide
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
