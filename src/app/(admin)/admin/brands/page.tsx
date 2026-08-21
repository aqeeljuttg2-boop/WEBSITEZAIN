'use client';

import React, { useEffect, useState } from 'react';
import { 
  BookmarkCheck, Plus, Search, Trash2, Edit, 
  Upload, X, Loader2, ExternalLink, Globe, Sparkles
} from 'lucide-react';
import Image from 'next/image';

interface BrandItem {
  id: string;
  name: string;
  slug: string;
  logo?: string | null;
  description?: string | null;
  websiteUrl?: string | null;
  isActive: boolean;
  orderIndex: number;
  _count?: { products: number };
}

export default function AdminBrandsPage() {
  const [brands, setBrands] = useState<BrandItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<BrandItem | null>(null);
  
  // Form states
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [logo, setLogo] = useState('');
  const [description, setDescription] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [orderIndex, setOrderIndex] = useState('0');

  const [deleteCandidate, setDeleteCandidate] = useState<BrandItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const loadBrands = async () => {
    try {
      const res = await fetch('/api/admin/brands?all=true', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setBrands(data.brands || []);
      }
    } catch (e) {
      console.error('Load brands error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBrands();
  }, []);

  const openAddModal = () => {
    setEditingBrand(null);
    setName('');
    setSlug('');
    setLogo('');
    setDescription('');
    setWebsiteUrl('');
    setIsActive(true);
    setOrderIndex('0');
    setIsModalOpen(true);
  };

  const openEditModal = (b: BrandItem) => {
    setEditingBrand(b);
    setName(b.name);
    setSlug(b.slug);
    setLogo(b.logo || '');
    setDescription(b.description || '');
    setWebsiteUrl(b.websiteUrl || '');
    setIsActive(b.isActive !== undefined ? b.isActive : true);
    setOrderIndex(b.orderIndex !== undefined ? b.orderIndex.toString() : '0');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const payload = {
      name: name.trim(),
      slug: slug.trim() || undefined,
      logo: logo.trim() || null,
      description: description.trim() || null,
      websiteUrl: websiteUrl.trim() || null,
      isActive,
      orderIndex: parseInt(orderIndex, 10) || 0
    };

    try {
      let res;
      if (editingBrand) {
        res = await fetch(`/api/admin/brands/${editingBrand.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch('/api/admin/brands', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      if (res.ok) {
        setIsModalOpen(false);
        loadBrands();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to save brand');
      }
    } catch (e: any) {
      alert(e.message || 'Error saving brand');
    }
  };

  const handleUploadLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingLogo(true);
    const formData = new FormData();
    formData.append('file', files[0]);

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      if (res.ok) {
        const data = await res.json();
        setLogo(data.url || data.urls[0]);
      }
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteCandidate) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/brands/${deleteCandidate.id}`, { method: 'DELETE' });
      if (res.ok) {
        setDeleteCandidate(null);
        loadBrands();
      }
    } catch (e) {
      console.error('Delete brand error:', e);
    } finally {
      setIsDeleting(false);
    }
  };

  const filtered = brands.filter(b => 
    !search || b.name.toLowerCase().includes(search.toLowerCase()) || b.slug.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      
      {/* 1. Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Brand Registry</h1>
          <p className="text-xs text-white/50 mt-1">
            Manage product manufacturers, private-label series, and brand logos.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="bg-[#C21875] hover:bg-[#A31260] text-white px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5 shadow-lg shadow-[#C21875]/25 transition-all"
        >
          <Plus size={16} />
          <span>Add Brand</span>
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
            placeholder="Search brands..."
            className="w-full bg-[#120a12] border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#C21875]"
          />
        </div>

        <span className="text-xs text-white/50">{brands.length} Total Brands</span>
      </div>

      {/* 3. Brands Grid */}
      {loading ? (
        <div className="min-h-[250px] flex items-center justify-center text-white">
          <Loader2 size={32} className="animate-spin text-[#C21875]" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.length === 0 ? (
            <div className="col-span-full bg-[#191019] border border-white/5 p-12 text-center rounded-2xl text-white/40 italic">
              No brands found. Click "Add Brand" to create one.
            </div>
          ) : (
            filtered.map((b) => (
              <div 
                key={b.id}
                className="bg-[#191019] border border-white/5 rounded-2xl p-5 space-y-4 hover:border-[#C21875]/30 transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-xl bg-[#120a12] border border-white/10 overflow-hidden relative flex items-center justify-center shrink-0">
                      {b.logo ? (
                        <Image src={b.logo} alt={b.name} fill sizes="48px" className="object-contain p-1" />
                      ) : (
                        <BookmarkCheck size={20} className="text-[#C21875]" />
                      )}
                    </div>

                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider font-mono border ${
                      b.isActive ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-white/10 text-white/40 border-white/15'
                    }`}>
                      {b.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-sm text-white">{b.name}</h3>
                    <span className="text-[10px] text-[#D6B36A] font-mono block">/{b.slug}</span>
                    <p className="text-xs text-white/50 mt-1 line-clamp-2">{b.description || 'No description provided.'}</p>
                  </div>
                </div>

                <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs">
                  <span className="text-white/40 font-mono text-[11px]">{b._count?.products || 0} products</span>
                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() => openEditModal(b)}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white"
                      title="Edit brand"
                    >
                      <Edit size={13} />
                    </button>
                    <button
                      onClick={() => setDeleteCandidate(b)}
                      className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400"
                      title="Delete brand"
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
          <div className="bg-[#191019] border border-white/10 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl flex flex-col">
            <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-[#140d14]">
              <h3 className="text-sm font-bold text-white">{editingBrand ? `Edit Brand` : 'Add Brand'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-white/60 hover:text-white"><X size={18} /></button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-white/70 block mb-1">Brand Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Cobalt Pro Series"
                  className="w-full bg-[#120a12] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:border-[#C21875] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-white/70 block mb-1">Brand Logo Image URL</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={logo}
                    onChange={(e) => setLogo(e.target.value)}
                    placeholder="/products/..."
                    className="flex-1 bg-[#120a12] border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-[#C21875] focus:outline-none"
                  />
                  <label className="bg-white/5 hover:bg-white/10 px-3 py-2 rounded-xl text-xs font-bold text-white cursor-pointer transition-colors">
                    Upload
                    <input type="file" accept="image/*" className="hidden" onChange={handleUploadLogo} />
                  </label>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-white/70 block mb-1">Website URL</label>
                <input
                  type="text"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  placeholder="https://brand-website.com"
                  className="w-full bg-[#120a12] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:border-[#C21875] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-white/70 block mb-1">Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Overview of this brand or manufacturing series..."
                  className="w-full bg-[#120a12] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:border-[#C21875] focus:outline-none"
                />
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="bActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded text-[#C21875]"
                />
                <label htmlFor="bActive" className="text-xs text-white cursor-pointer">
                  Active (Visible on product cards and filters)
                </label>
              </div>

              <div className="pt-4 border-t border-white/5 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-white/60 hover:text-white bg-white/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-wider text-white bg-[#C21875] hover:bg-[#A31260] shadow-lg shadow-[#C21875]/25"
                >
                  {editingBrand ? 'Update Brand' : 'Save Brand'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. DELETE MODAL */}
      {deleteCandidate && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#191019] border border-red-500/30 w-full max-w-md rounded-3xl p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white">Delete Brand</h3>
            <p className="text-xs text-white/70">
              Are you sure you want to delete <strong className="text-white">{deleteCandidate.name}</strong>? Linked products will be unassigned safely.
            </p>
            <div className="pt-2 flex items-center justify-end space-x-3">
              <button onClick={() => setDeleteCandidate(null)} className="px-4 py-2 rounded-xl text-xs font-semibold text-white/60 bg-white/5">
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider text-white bg-red-600 hover:bg-red-700"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
