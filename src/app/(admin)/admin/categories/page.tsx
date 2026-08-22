'use client';

import React, { useEffect, useState } from 'react';
import { 
  Layers, Plus, Search, Trash2, Edit, ChevronRight, 
  ChevronDown, Image as ImageIcon, Sparkles, AlertTriangle, 
  FolderPlus, Loader2, ArrowUpDown, X, Check, Globe, Zap
} from 'lucide-react';
import Image from 'next/image';
import { useRealtime } from '@/context/RealtimeContext';
import { normalizeImageUrl } from '@/lib/imageResolver';

interface SubcategoryItem {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  image?: string | null;
  icon?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  isActive: boolean;
  orderIndex: number;
  _count?: { products: number };
}

interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  image?: string | null;
  icon?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  isActive: boolean;
  orderIndex: number;
  subcategories: SubcategoryItem[];
  _count?: { products: number };
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expandedCats, setExpandedCats] = useState<Record<string, boolean>>({});

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any | null>(null);
  
  // Form Fields
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [icon, setIcon] = useState('');
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [parentId, setParentId] = useState<string>('');
  const [orderIndex, setOrderIndex] = useState('0');

  // Media Picker modal
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [mediaList, setMediaList] = useState<{ id: string; fileName: string; fileUrl: string }[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Safe Delete Modal
  const [deleteCandidate, setDeleteCandidate] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [togglingCatId, setTogglingCatId] = useState<string | null>(null);

  const loadCategories = async () => {
    try {
      const res = await fetch('/api/categories?all=true', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories || []);
        
        // Auto-expand all categories by default
        const exp: Record<string, boolean> = {};
        (data.categories || []).forEach((c: any) => { exp[c.id] = true; });
        setExpandedCats(exp);
      }
    } catch (e) {
      console.error('Load categories error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  // Real-time live auto-refresh on category updates
  useRealtime(['CATEGORY_CREATED', 'CATEGORY_UPDATED', 'CATEGORY_DELETED', 'CATEGORY_REORDERED'], () => {
    loadCategories();
  });

  // Inline live toggle for category status
  const handleInlineToggleActive = async (catId: string, currentStatus: boolean) => {
    setTogglingCatId(catId);
    const newStatus = !currentStatus;

    // Optimistic UI update
    setCategories(prev => prev.map(c => {
      if (c.id === catId) return { ...c, isActive: newStatus };
      if (c.subcategories) {
        return {
          ...c,
          subcategories: c.subcategories.map(s => s.id === catId ? { ...s, isActive: newStatus } : s)
        };
      }
      return c;
    }));

    try {
      await fetch(`/api/categories/${catId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: newStatus })
      });
    } catch (err) {
      console.error('Toggle category error:', err);
      loadCategories();
    } finally {
      setTogglingCatId(null);
    }
  };

  const loadMediaLibrary = async () => {
    try {
      const res = await fetch('/api/admin/media?limit=100');
      if (res.ok) {
        const data = await res.json();
        setMediaList(data.media || []);
      }
    } catch (e) {
      console.error('Failed to load media:', e);
    }
  };

  const openAddCategoryModal = (parentCatId: string = '') => {
    setEditingCategory(null);
    setName('');
    setSlug('');
    setDescription('');
    setImage('');
    setIcon('');
    setSeoTitle('');
    setSeoDescription('');
    setIsActive(true);
    setParentId(parentCatId);
    setOrderIndex('0');
    setIsModalOpen(true);
  };

  const openEditModal = (cat: any) => {
    setEditingCategory(cat);
    setName(cat.name);
    setSlug(cat.slug);
    setDescription(cat.description || '');
    setImage(cat.image || '');
    setIcon(cat.icon || '');
    setSeoTitle(cat.seoTitle || '');
    setSeoDescription(cat.seoDescription || '');
    setIsActive(cat.isActive !== undefined ? cat.isActive : true);
    setParentId(cat.parentId || '');
    setOrderIndex(cat.orderIndex !== undefined ? cat.orderIndex.toString() : '0');
    setIsModalOpen(true);
  };

  const toggleExpand = (catId: string) => {
    setExpandedCats(prev => ({ ...prev, [catId]: !prev[catId] }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const payload = {
      name: name.trim(),
      slug: slug.trim() || undefined,
      description: description.trim() || null,
      image: image.trim() || null,
      icon: icon.trim() || null,
      seoTitle: seoTitle.trim() || null,
      seoDescription: seoDescription.trim() || null,
      isActive,
      parentId: parentId || null,
      orderIndex: parseInt(orderIndex, 10) || 0
    };

    try {
      let res;
      if (editingCategory) {
        res = await fetch(`/api/categories/${editingCategory.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch('/api/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      if (res.ok) {
        setIsModalOpen(false);
        loadCategories();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to save category');
      }
    } catch (e: any) {
      alert(e.message || 'Error saving category');
    }
  };

  const compressClientImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new window.Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const maxDim = 1200;
          if (width > height && width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', 0.85));
            return;
          }
          resolve(e.target?.result as string);
        };
        img.onerror = () => resolve(e.target?.result as string);
        img.src = e.target?.result as string;
      };
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    });
  };

  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingImage(true);

    try {
      const base64 = await compressClientImage(files[0]);
      if (!base64) {
        alert('Please select a valid image');
        return;
      }

      setImage(base64);

      try {
        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ images: [base64] })
        });
        if (res.ok) {
          const data = await res.json();
          if (data.url || (data.urls && data.urls[0])) {
            setImage(data.url || data.urls[0]);
          }
        }
      } catch (netErr) {
        console.warn('API category upload fallback to dataUrl:', netErr);
      }
    } catch (err: any) {
      console.error('Upload failed:', err);
      alert('Upload failed: ' + (err?.message || 'Please try another file'));
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  const handleDelete = async () => {
    if (!deleteCandidate) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/categories/${deleteCandidate.id}`, { method: 'DELETE' });
      if (res.ok) {
        setDeleteCandidate(null);
        loadCategories();
      }
    } catch (e) {
      console.error('Delete category error:', e);
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredCategories = categories.filter(c => {
    const matchesSearch = !search || 
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.slug.toLowerCase().includes(search.toLowerCase()) ||
      c.subcategories.some(sub => sub.name.toLowerCase().includes(search.toLowerCase()));
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      
      {/* 1. Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Categories & Subcategories</h1>
          <p className="text-xs text-white/50 mt-1">
            Build your catalog hierarchy. Parent categories and subcategories automatically update storefront navigation.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => openAddCategoryModal('')}
            className="bg-[#C21875] hover:bg-[#A31260] text-white px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5 shadow-lg shadow-[#C21875]/25 transition-all"
          >
            <FolderPlus size={16} />
            <span>Add Parent Category</span>
          </button>
        </div>
      </div>

      {/* 2. Search & Overview Strip */}
      <div className="bg-[#191019] border border-white/5 p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="w-full md:w-96 relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search categories or subcategories..."
            className="w-full bg-[#120a12] border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#C21875]"
          />
        </div>

        <div className="text-xs text-white/50 flex items-center space-x-4">
          <span>{categories.length} Parent Categories</span>
          <span>•</span>
          <span>
            {categories.reduce((sum, c) => sum + (c.subcategories ? c.subcategories.length : 0), 0)} Subcategories
          </span>
        </div>
      </div>

      {/* 3. Category Tree View */}
      {loading ? (
        <div className="min-h-[250px] flex items-center justify-center text-white">
          <Loader2 size={32} className="animate-spin text-[#C21875]" />
        </div>
      ) : (
        <div className="space-y-3">
          {filteredCategories.length === 0 ? (
            <div className="bg-[#191019] border border-white/5 p-12 text-center rounded-2xl text-white/40 italic">
              No categories found. Click "Add Parent Category" to create your first category.
            </div>
          ) : (
            filteredCategories.map((cat) => {
              const isExpanded = expandedCats[cat.id];
              const subCount = cat.subcategories ? cat.subcategories.length : 0;
              const prodCount = (cat._count?.products || 0) + (cat.subcategories?.reduce((sum, s) => sum + (s._count?.products || 0), 0) || 0);

              return (
                <div 
                  key={cat.id} 
                  className="bg-[#191019] border border-white/5 rounded-2xl overflow-hidden shadow-lg transition-all"
                >
                  
                  {/* Parent Category Card Header */}
                  <div className="p-4 flex items-center justify-between bg-[#140d14] hover:bg-white/[0.02] transition-colors">
                    
                    <div className="flex items-center space-x-3">
                      {subCount > 0 && (
                        <button
                          onClick={() => toggleExpand(cat.id)}
                          className="p-1 rounded-lg text-white/60 hover:text-white"
                        >
                          {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        </button>
                      )}

                      {/* Image Thumbnail */}
                      <div className="w-10 h-10 rounded-xl bg-[#120a12] border border-white/10 overflow-hidden relative flex items-center justify-center shrink-0">
                        {cat.image ? (
                          <Image src={normalizeImageUrl(cat.image)} alt={cat.name} fill sizes="40px" className="object-cover" />
                        ) : (
                          <Layers size={18} className="text-[#C21875]" />
                        )}
                      </div>

                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="font-bold text-sm text-white">{cat.name}</h3>
                          <span className="text-[10px] text-[#D6B36A] font-mono font-bold">/{cat.slug}</span>
                          {!cat.isActive && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 font-bold">
                              HIDDEN
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-white/40 mt-0.5">
                          {subCount} subcategories • {prodCount} products linked
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => openAddCategoryModal(cat.id)}
                        className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-[#C21875] text-white text-xs font-bold transition-all flex items-center space-x-1"
                      >
                        <Plus size={13} />
                        <span>Add Sub</span>
                      </button>

                      <button
                        onClick={() => openEditModal(cat)}
                        className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white"
                        title="Edit category"
                      >
                        <Edit size={14} />
                      </button>

                      <button
                        onClick={() => setDeleteCandidate(cat)}
                        className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400"
                        title="Delete category"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                  </div>

                  {/* Subcategories List */}
                  {isExpanded && subCount > 0 && (
                    <div className="p-4 pl-12 border-t border-white/5 space-y-2 bg-[#120a12]">
                      {cat.subcategories.map((sub) => (
                        <div 
                          key={sub.id} 
                          className="flex items-center justify-between p-2.5 rounded-xl bg-[#191019] border border-white/5 hover:border-white/10 transition-colors"
                        >
                          <div className="flex items-center space-x-3">
                            <span className="text-white/30 text-xs font-mono">└──</span>
                            <div className="w-7 h-7 rounded-lg bg-[#140d14] border border-white/10 overflow-hidden relative flex items-center justify-center shrink-0">
                              {sub.image ? (
                                <Image src={normalizeImageUrl(sub.image)} alt={sub.name} fill sizes="28px" className="object-cover" />
                              ) : (
                                <span className="text-[10px] text-[#D6B36A] font-bold">SUB</span>
                              )}
                            </div>

                            <div>
                              <span className="font-bold text-xs text-white">{sub.name}</span>
                              <span className="text-[10px] text-white/40 font-mono ml-2">/{sub.slug}</span>
                            </div>
                          </div>

                          <div className="flex items-center space-x-3">
                            <span className="text-[10px] font-mono text-white/50 bg-white/5 px-2 py-0.5 rounded">
                              {sub._count?.products || 0} products
                            </span>

                            <div className="flex items-center space-x-1">
                              <button
                                onClick={() => openEditModal({ ...sub, parentId: cat.id })}
                                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white"
                              >
                                <Edit size={12} />
                              </button>
                              <button
                                onClick={() => setDeleteCandidate(sub)}
                                className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                </div>
              );
            })
          )}
        </div>
      )}

      {/* 4. CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#191019] border border-white/10 w-full max-w-xl rounded-3xl overflow-hidden shadow-2xl flex flex-col">
            
            <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-[#140d14]">
              <div>
                <h3 className="text-sm font-bold text-white">
                  {editingCategory ? `Edit Category: ${editingCategory.name}` : 'Create Category'}
                </h3>
                <p className="text-[10px] text-white/40">Assign as Parent or Subcategory</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-white/60 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              
              <div>
                <label className="text-xs font-semibold text-white/70 block mb-1">Category Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Volume Lash Tweezers"
                  className="w-full bg-[#120a12] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:border-[#C21875] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-white/70 block mb-1">Slug (URL)</label>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="auto-generated"
                    className="w-full bg-[#120a12] border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-[#C21875] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-white/70 block mb-1">Parent Hierarchy</label>
                  <select
                    value={parentId}
                    onChange={(e) => setParentId(e.target.value)}
                    className="w-full bg-[#120a12] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-[#C21875] focus:outline-none"
                  >
                    <option value="">-- None (Root Parent Category) --</option>
                    {categories
                      .filter(c => !editingCategory || c.id !== editingCategory.id)
                      .map(c => <option key={c.id} value={c.id}>{c.name}</option>)
                    }
                  </select>
                </div>
              </div>

              {/* Image URL & Upload */}
              <div>
                <label className="text-xs font-semibold text-white/70 block mb-1">Category Image</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={image}
                    onChange={(e) => setImage(e.target.value)}
                    placeholder="/catagori/..."
                    className="flex-1 bg-[#120a12] border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-[#C21875] focus:outline-none"
                  />
                  <label className="bg-white/5 hover:bg-white/10 px-3 py-2 rounded-xl text-xs font-bold text-white cursor-pointer transition-colors">
                    Upload
                    <input type="file" accept="image/*" className="hidden" onChange={handleUploadImage} />
                  </label>
                  <button
                    type="button"
                    onClick={() => { loadMediaLibrary(); setShowMediaPicker(true); }}
                    className="bg-white/5 hover:bg-white/10 px-3 py-2 rounded-xl text-xs font-bold text-[#D6B36A] transition-colors"
                  >
                    Media
                  </button>
                </div>
                {image && (
                  <div className="w-16 h-16 rounded-xl bg-[#120a12] border border-white/10 overflow-hidden relative mt-2">
                    <Image src={normalizeImageUrl(image)} alt="Preview" fill unoptimized sizes="64px" className="object-cover" />
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-white/70 block mb-1">Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Overview of this category..."
                  className="w-full bg-[#120a12] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-[#C21875] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-white/70 block mb-1">SEO Title</label>
                  <input
                    type="text"
                    value={seoTitle}
                    onChange={(e) => setSeoTitle(e.target.value)}
                    placeholder="Page Title for Google"
                    className="w-full bg-[#120a12] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-[#C21875] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-white/70 block mb-1">Order Index</label>
                  <input
                    type="number"
                    value={orderIndex}
                    onChange={(e) => setOrderIndex(e.target.value)}
                    placeholder="0"
                    className="w-full bg-[#120a12] border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-[#C21875] focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded text-[#C21875]"
                />
                <label htmlFor="isActive" className="text-xs text-white cursor-pointer">
                  Active (Visible on Storefront Navigation & Filters)
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
                  {editingCategory ? 'Update Category' : 'Save Category'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* 5. MEDIA LIBRARY PICKER MODAL */}
      {showMediaPicker && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#191019] border border-white/10 w-full max-w-2xl max-h-[80vh] rounded-3xl overflow-hidden shadow-2xl flex flex-col">
            <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-[#140d14]">
              <h3 className="text-sm font-bold text-white">Select Category Image</h3>
              <button onClick={() => setShowMediaPicker(false)} className="text-white/60 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
              {mediaList.map(item => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => { setImage(item.fileUrl); setShowMediaPicker(false); }}
                  className="group relative aspect-square rounded-xl bg-[#120a12] border border-white/10 overflow-hidden hover:border-[#C21875] transition-all flex items-center justify-center"
                >
                  <Image src={item.fileUrl} alt={item.fileName} fill sizes="100px" className="object-cover" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 6. SAFE DELETE CONFIRMATION MODAL */}
      {deleteCandidate && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#191019] border border-red-500/30 w-full max-w-md rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center space-x-3 text-red-400">
              <AlertTriangle size={28} />
              <h3 className="text-base font-bold text-white">Safe Category Deletion</h3>
            </div>

            <p className="text-xs text-white/70 leading-relaxed">
              Are you sure you want to delete <strong className="text-white">{deleteCandidate.name}</strong>?
              <br /><br />
              <span className="text-[#D6B36A] font-bold">Safety Guarantee:</span> Products linked to this category will NOT be deleted; they will be safely marked as uncategorized.
            </p>

            <div className="pt-2 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => setDeleteCandidate(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white/60 hover:text-white bg-white/5"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider text-white bg-red-600 hover:bg-red-700 transition-colors flex items-center space-x-1.5"
              >
                {isDeleting && <Loader2 size={13} className="animate-spin" />}
                <span>Confirm Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
