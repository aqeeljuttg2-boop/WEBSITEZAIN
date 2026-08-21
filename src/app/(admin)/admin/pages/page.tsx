'use client';

import React, { useEffect, useState } from 'react';
import { 
  FileText, Plus, Search, Trash2, Edit, ExternalLink, 
  Upload, X, Loader2, Globe, Eye, Sparkles
} from 'lucide-react';
import Link from 'next/link';

interface PageItem {
  id: string;
  title: string;
  slug: string;
  content: string;
  bannerImage?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  isPublished: boolean;
  template: string;
  updatedAt: string;
}

export default function AdminPagesManagerPage() {
  const [pages, setPages] = useState<PageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPage, setEditingPage] = useState<PageItem | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [content, setContent] = useState('');
  const [bannerImage, setBannerImage] = useState('');
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [isPublished, setIsPublished] = useState(true);
  const [template, setTemplate] = useState('STANDARD');

  const loadPages = async () => {
    try {
      const res = await fetch('/api/admin/pages?all=true', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setPages(data.pages || []);
      }
    } catch (e) {
      console.error('Load pages error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPages();
  }, []);

  const openAddModal = () => {
    setEditingPage(null);
    setTitle('');
    setSlug('');
    setContent('');
    setBannerImage('');
    setSeoTitle('');
    setSeoDescription('');
    setIsPublished(true);
    setTemplate('STANDARD');
    setIsModalOpen(true);
  };

  const openEditModal = (p: PageItem) => {
    setEditingPage(p);
    setTitle(p.title);
    setSlug(p.slug);
    setContent(p.content || '');
    setBannerImage(p.bannerImage || '');
    setSeoTitle(p.seoTitle || '');
    setSeoDescription(p.seoDescription || '');
    setIsPublished(p.isPublished);
    setTemplate(p.template || 'STANDARD');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const payload = {
      title: title.trim(),
      slug: slug.trim() || undefined,
      content,
      bannerImage: bannerImage.trim() || null,
      seoTitle: seoTitle.trim() || null,
      seoDescription: seoDescription.trim() || null,
      isPublished,
      template
    };

    try {
      let res;
      if (editingPage) {
        res = await fetch(`/api/admin/pages/${editingPage.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch('/api/admin/pages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      if (res.ok) {
        setIsModalOpen(false);
        loadPages();
      }
    } catch (e) {
      console.error('Save page error:', e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this content page?')) return;
    try {
      await fetch(`/api/admin/pages/${id}`, { method: 'DELETE' });
      loadPages();
    } catch (e) {
      console.error('Delete page error:', e);
    }
  };

  const filtered = pages.filter(p => 
    !search || 
    p.title.toLowerCase().includes(search.toLowerCase()) || 
    p.slug.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      
      {/* 1. Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Pages & Content Manager</h1>
          <p className="text-xs text-white/50 mt-1">
            Edit content and SEO for your storefront pages (About Us, Contact, FAQ, Terms, Privacy, Shipping, Wholesale, etc.).
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="bg-[#C21875] hover:bg-[#A31260] text-white px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5 shadow-lg shadow-[#C21875]/25 transition-all"
        >
          <Plus size={16} />
          <span>Create New Page</span>
        </button>
      </div>

      {/* 2. Search & Stats */}
      <div className="bg-[#191019] border border-white/5 p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="w-full md:w-96 relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search pages by title or slug..."
            className="w-full bg-[#120a12] border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#C21875]"
          />
        </div>

        <span className="text-xs text-white/50 font-mono">
          {pages.length} CMS Pages Configured
        </span>
      </div>

      {/* 3. Pages List */}
      {loading ? (
        <div className="min-h-[250px] flex items-center justify-center text-white">
          <Loader2 size={32} className="animate-spin text-[#C21875]" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((p) => (
            <div
              key={p.id}
              className="bg-[#191019] border border-white/5 rounded-2xl p-5 space-y-4 hover:border-[#C21875]/30 transition-all flex flex-col justify-between"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-[#D6B36A] font-bold">/{p.slug}</span>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase font-mono ${
                    p.isPublished ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                  }`}>
                    {p.isPublished ? 'Published' : 'Draft'}
                  </span>
                </div>

                <h3 className="font-bold text-sm text-white">{p.title}</h3>
                <p className="text-xs text-white/50 line-clamp-3 leading-relaxed">
                  {p.seoDescription || p.content?.slice(0, 140) || 'No preview description.'}
                </p>
              </div>

              <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs">
                <span className="text-[10px] text-white/40 font-mono">
                  Updated {new Date(p.updatedAt).toLocaleDateString()}
                </span>

                <div className="flex items-center space-x-1.5">
                  <Link
                    href={`/${p.slug}`}
                    target="_blank"
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white"
                    title="View live page"
                  >
                    <ExternalLink size={13} />
                  </Link>
                  <button
                    onClick={() => openEditModal(p)}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-[#C21875] text-white"
                    title="Edit content"
                  >
                    <Edit size={13} />
                  </button>
                  <button
                    onClick={() => handleDelete(p.id)}
                    className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400"
                    title="Delete page"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 4. MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#191019] border border-white/10 w-full max-w-3xl max-h-[90vh] rounded-3xl overflow-hidden shadow-2xl flex flex-col">
            <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-[#140d14]">
              <h3 className="text-sm font-bold text-white">{editingPage ? `Edit Page: ${editingPage.title}` : 'Create Page'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-white/60 hover:text-white"><X size={18} /></button>
            </div>

            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-white/70 block mb-1">Page Title *</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. About Our Factory"
                    className="w-full bg-[#120a12] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:border-[#C21875] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-white/70 block mb-1">Slug (URL)</label>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="e.g. about (auto-generated if empty)"
                    className="w-full bg-[#120a12] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:border-[#C21875] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-white/70 block mb-1">Page Body Content (Markdown / HTML)</label>
                <textarea
                  rows={8}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="### Section Heading&#10;&#10;Write comprehensive page content..."
                  className="w-full bg-[#120a12] border border-white/10 rounded-xl p-3.5 text-xs text-white font-mono focus:border-[#C21875] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-white/70 block mb-1">SEO Title</label>
                  <input
                    type="text"
                    value={seoTitle}
                    onChange={(e) => setSeoTitle(e.target.value)}
                    placeholder="Page Title for Google Search"
                    className="w-full bg-[#120a12] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:border-[#C21875] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-white/70 block mb-1">Header Banner Image URL</label>
                  <input
                    type="text"
                    value={bannerImage}
                    onChange={(e) => setBannerImage(e.target.value)}
                    placeholder="/catagori/..."
                    className="w-full bg-[#120a12] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:border-[#C21875] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-white/70 block mb-1">SEO Meta Description</label>
                <textarea
                  rows={2}
                  value={seoDescription}
                  onChange={(e) => setSeoDescription(e.target.value)}
                  placeholder="Brief summary for search engines"
                  className="w-full bg-[#120a12] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:border-[#C21875] focus:outline-none"
                />
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="pagePublished"
                  checked={isPublished}
                  onChange={(e) => setIsPublished(e.target.checked)}
                  className="rounded text-[#C21875]"
                />
                <label htmlFor="pagePublished" className="text-xs text-white cursor-pointer">
                  Published (Live publicly on storefront)
                </label>
              </div>

              <div className="pt-4 border-t border-white/5 flex items-center justify-end space-x-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-xl text-xs font-semibold text-white/60 bg-white/5">
                  Cancel
                </button>
                <button type="submit" className="px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-wider text-white bg-[#C21875] hover:bg-[#A31260]">
                  Save Page
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
