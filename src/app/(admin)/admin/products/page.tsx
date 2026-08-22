'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Box, Plus, Search, Trash2, Edit, FileSpreadsheet, 
  Upload, Download, X, AlertCircle, RefreshCcw, Copy,
  ChevronUp, ChevronDown, Check, Image as ImageIcon, Eye,
  SlidersHorizontal, Filter, ArrowLeft, ArrowRight, Star,
  DollarSign, Package, Tag, Layers, CheckSquare, Square,
  Sparkles, Flame, ShieldAlert, Video, ExternalLink, Loader2, Zap
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRealtime } from '@/context/RealtimeContext';
import { getProductImage } from '@/lib/imageResolver';

interface PricingTierInput {
  minQuantity: number;
  pricePerUnit: number;
}

interface ProductItem {
  id: string;
  name: string;
  slug: string;
  productCode: string;
  sku: string;
  categoryId?: string | null;
  category?: { id: string; name: string; slug: string } | null;
  brandId?: string | null;
  brand?: { id: string; name: string; slug: string } | null;
  shortDescription?: string | null;
  description?: string | null;
  specifications?: string | null;
  material?: string | null;
  size?: string | null;
  finish?: string | null;
  weight?: string | null;
  unit?: string | null;
  color?: string | null;
  tags?: string | null;
  images?: string | null;
  videoUrl?: string | null;
  stock: number;
  moq: number;
  singlePrice: number;
  salePrice?: number | null;
  wholesalePrice?: number | null;
  isFeatured?: boolean;
  isNew?: boolean;
  isBestseller?: boolean;
  isSale?: boolean;
  orderIndex?: number;
  status: string;
  seoTitle?: string | null;
  seoDescription?: string | null;
  seoKeywords?: string | null;
  pricingTiers?: { minQuantity: number; pricePerUnit: number }[];
  createdAt?: string;
}

export default function AdminProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string; isParent?: boolean }[]>([]);
  const [brands, setBrands] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('ALL');
  const [selectedBrandFilter, setSelectedBrandFilter] = useState('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL');
  const [selectedBadgeFilter, setSelectedBadgeFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('newest');
  
  // Selection for bulk actions
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState('');
  const [bulkCategoryTarget, setBulkCategoryTarget] = useState('');
  const [bulkStatusTarget, setBulkStatusTarget] = useState('ACTIVE');
  const [bulkLoading, setBulkLoading] = useState(false);
  const [togglingProductId, setTogglingProductId] = useState<string | null>(null);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);
  const [activeTab, setActiveTab] = useState<'general' | 'pricing' | 'images' | 'specs' | 'badges' | 'seo'>('general');

  // Form states
  const [name, setName] = useState('');
  const [productCode, setProductCode] = useState('');
  const [sku, setSku] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [brandId, setBrandId] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [description, setDescription] = useState('');
  const [material, setMaterial] = useState('');
  const [size, setSize] = useState('');
  const [finish, setFinish] = useState('');
  const [weight, setWeight] = useState('');
  const [unit, setUnit] = useState('Piece');
  const [color, setColor] = useState('');
  const [tags, setTags] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  
  // 5 Dedicated Image Slots + Additional dynamic images
  const [imageSlots, setImageSlots] = useState<string[]>(['', '', '', '', '']);
  const [stock, setStock] = useState('100');
  const [moq, setMoq] = useState('1');
  const [singlePrice, setSinglePrice] = useState('0');
  const [salePrice, setSalePrice] = useState('');
  const [wholesalePrice, setWholesalePrice] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);
  const [isNew, setIsNew] = useState(false);
  const [isBestseller, setIsBestseller] = useState(false);
  const [isSale, setIsSale] = useState(false);
  const [orderIndex, setOrderIndex] = useState('0');
  const [status, setStatus] = useState('ACTIVE');
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [seoKeywords, setSeoKeywords] = useState('');
  const [pricingTiers, setPricingTiers] = useState<PricingTierInput[]>([]);

  // Media picker modal
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [targetSlotIndex, setTargetSlotIndex] = useState<number | null>(null);
  const [mediaList, setMediaList] = useState<{ id: string; fileName: string; fileUrl: string }[]>([]);
  const [mediaSearch, setMediaSearch] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  // Delete Confirmation Modal
  const [deleteCandidate, setDeleteCandidate] = useState<ProductItem | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadData = async () => {
    try {
      const [pRes, cRes, bRes] = await Promise.all([
        fetch('/api/products?status=ALL&limit=2000', { cache: 'no-store' }),
        fetch('/api/categories', { cache: 'no-store' }),
        fetch('/api/admin/brands?all=true', { cache: 'no-store' })
      ]);

      if (pRes.ok) {
        const pData = await pRes.json();
        setProducts(pData.products || []);
      }
      
      if (cRes.ok) {
        const cData = await cRes.json();
        const list: { id: string; name: string; isParent?: boolean }[] = [];
        (cData.categories || []).forEach((cat: any) => {
          list.push({ id: cat.id, name: `${cat.name} (Parent)`, isParent: true });
          if (cat.subcategories) {
            cat.subcategories.forEach((sub: any) => {
              list.push({ id: sub.id, name: `── ${sub.name} (${cat.name})`, isParent: false });
            });
          }
        });
        setCategories(list);
      }

      if (bRes.ok) {
        const bData = await bRes.json();
        setBrands(bData.brands || []);
      }
    } catch (e) {
      console.error('Load products data error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Real-time live auto-refresh on catalog mutations
  useRealtime(['PRODUCT_CREATED', 'PRODUCT_UPDATED', 'PRODUCT_DELETED', 'PRODUCT_BULK_UPDATED'], () => {
    loadData();
  });

  // Inline live toggle helper for badges & status
  const handleInlineToggle = async (
    product: ProductItem, 
    field: 'isFeatured' | 'isNew' | 'isBestseller' | 'isSale' | 'status'
  ) => {
    setTogglingProductId(product.id);
    let newValue: any;
    if (field === 'status') {
      newValue = product.status === 'ACTIVE' ? 'DRAFT' : 'ACTIVE';
    } else {
      newValue = !product[field];
    }

    // Optimistic UI update
    setProducts(prev => prev.map(p => p.id === product.id ? { ...p, [field]: newValue } : p));

    try {
      await fetch(`/api/products/${product.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: newValue })
      });
    } catch (err) {
      console.error('Inline toggle error:', err);
      loadData();
    } finally {
      setTogglingProductId(null);
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

  const openAddModal = () => {
    setEditingProduct(null);
    setName('');
    setProductCode('');
    setSku('');
    setCategoryId(categories.length > 0 ? categories[0].id : '');
    setBrandId(brands.length > 0 ? brands[0].id : '');
    setShortDescription('');
    setDescription('');
    setMaterial('');
    setSize('');
    setFinish('');
    setWeight('');
    setUnit('Piece');
    setColor('');
    setTags('');
    setVideoUrl('');
    setImageSlots(['', '', '', '', '']);
    setStock('100');
    setMoq('1');
    setSinglePrice('0');
    setSalePrice('');
    setWholesalePrice('');
    setIsFeatured(false);
    setIsNew(false);
    setIsBestseller(false);
    setIsSale(false);
    setOrderIndex('0');
    setStatus('ACTIVE');
    setSeoTitle('');
    setSeoDescription('');
    setSeoKeywords('');
    setPricingTiers([]);
    setActiveTab('general');
    setIsModalOpen(true);
  };

  const openEditModal = (prod: ProductItem) => {
    setEditingProduct(prod);
    setName(prod.name);
    setProductCode(prod.productCode);
    setSku(prod.sku);
    setCategoryId(prod.categoryId || '');
    setBrandId(prod.brandId || '');
    setShortDescription(prod.shortDescription || '');
    setDescription(prod.description || '');
    setMaterial(prod.material || '');
    setSize(prod.size || '');
    setFinish(prod.finish || '');
    setWeight(prod.weight || '');
    setUnit(prod.unit || 'Piece');
    setColor(prod.color || '');
    setTags(prod.tags || '');
    setVideoUrl(prod.videoUrl || '');

    // Parse image list into slots
    let parsedImages: string[] = [];
    if (prod.images) {
      if (prod.images.startsWith('[')) {
        try { parsedImages = JSON.parse(prod.images); } catch (e) { parsedImages = [prod.images]; }
      } else {
        parsedImages = prod.images.split(',').map(s => s.trim()).filter(Boolean);
      }
    }
    while (parsedImages.length < 5) parsedImages.push('');
    setImageSlots(parsedImages);

    setStock(prod.stock.toString());
    setMoq(prod.moq.toString());
    setSinglePrice(prod.singlePrice.toString());
    setSalePrice(prod.salePrice !== undefined && prod.salePrice !== null ? prod.salePrice.toString() : '');
    setWholesalePrice(prod.wholesalePrice !== undefined && prod.wholesalePrice !== null ? prod.wholesalePrice.toString() : '');
    setIsFeatured(Boolean(prod.isFeatured));
    setIsNew(Boolean(prod.isNew));
    setIsBestseller(Boolean(prod.isBestseller));
    setIsSale(Boolean(prod.isSale));
    setOrderIndex(prod.orderIndex !== undefined ? prod.orderIndex.toString() : '0');
    setStatus(prod.status || 'ACTIVE');
    setSeoTitle(prod.seoTitle || '');
    setSeoDescription(prod.seoDescription || '');
    setSeoKeywords(prod.seoKeywords || '');
    setPricingTiers(prod.pricingTiers ? prod.pricingTiers.map(t => ({ minQuantity: t.minQuantity, pricePerUnit: t.pricePerUnit })) : []);
    setActiveTab('general');
    setIsModalOpen(true);
  };

  const handleDuplicate = async (prod: ProductItem) => {
    try {
      const randomCode = Math.floor(1000 + Math.random() * 9000);
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${prod.name} (Copy)`,
          productCode: `${prod.productCode}-COPY-${randomCode}`,
          sku: `${prod.sku}-COPY-${randomCode}`,
          categoryId: prod.categoryId,
          brandId: prod.brandId,
          shortDescription: prod.shortDescription,
          description: prod.description,
          material: prod.material,
          size: prod.size,
          finish: prod.finish,
          weight: prod.weight,
          unit: prod.unit,
          color: prod.color,
          tags: prod.tags,
          images: prod.images,
          stock: prod.stock,
          moq: prod.moq,
          singlePrice: prod.singlePrice,
          salePrice: prod.salePrice,
          wholesalePrice: prod.wholesalePrice,
          status: 'DRAFT',
          isFeatured: false,
          isNew: true,
          pricingTiers: prod.pricingTiers
        })
      });

      if (res.ok) {
        loadData();
      }
    } catch (e) {
      console.error('Duplicate error:', e);
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    // Filter out empty image slots
    const validImages = imageSlots.filter(s => s && s.trim());
    const imagesString = validImages.length > 0 ? validImages.join(',') : '';

    const payload = {
      name: name.trim(),
      productCode: productCode.trim(),
      sku: sku.trim(),
      categoryId: categoryId || null,
      brandId: brandId || null,
      shortDescription: shortDescription.trim() || null,
      description: description.trim() || null,
      material: material.trim() || null,
      size: size.trim() || null,
      finish: finish.trim() || null,
      weight: weight.trim() || null,
      unit: unit || 'Piece',
      color: color.trim() || null,
      tags: tags.trim() || null,
      videoUrl: videoUrl.trim() || null,
      images: imagesString,
      stock: parseInt(stock, 10) || 0,
      moq: parseInt(moq, 10) || 1,
      singlePrice: parseFloat(singlePrice) || 0,
      salePrice: salePrice ? parseFloat(salePrice) : null,
      wholesalePrice: wholesalePrice ? parseFloat(wholesalePrice) : null,
      isFeatured,
      isNew,
      isBestseller,
      isSale,
      orderIndex: parseInt(orderIndex, 10) || 0,
      status,
      seoTitle: seoTitle.trim() || null,
      seoDescription: seoDescription.trim() || null,
      seoKeywords: seoKeywords.trim() || null,
      pricingTiers: pricingTiers.filter(t => t.minQuantity && t.pricePerUnit)
    };

    try {
      let res;
      if (editingProduct) {
        res = await fetch(`/api/products/${editingProduct.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      if (res.ok) {
        setIsModalOpen(false);
        loadData();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to save product');
      }
    } catch (e: any) {
      alert(e.message || 'Error saving product');
    }
  };

  // Image Slot Management
  const handleUploadImageFile = async (e: React.ChangeEvent<HTMLInputElement>, slotIdx: number) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingImage(true);
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      if (res.ok) {
        const data = await res.json();
        const urls: string[] = data.urls || [data.url];
        
        const newSlots = [...imageSlots];
        // Place first image in current slot
        newSlots[slotIdx] = urls[0];
        
        // Fill consecutive empty slots with remaining uploaded images
        let cur = slotIdx + 1;
        for (let i = 1; i < urls.length; i++) {
          if (cur < newSlots.length) {
            newSlots[cur] = urls[i];
          } else {
            newSlots.push(urls[i]);
          }
          cur++;
        }
        setImageSlots(newSlots);
      }
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setUploadingImage(false);
    }
  };

  const removeSlotImage = (idx: number) => {
    const newSlots = [...imageSlots];
    newSlots[idx] = '';
    setImageSlots(newSlots);
  };

  const setPrimarySlotImage = (idx: number) => {
    if (idx === 0) return;
    const newSlots = [...imageSlots];
    const target = newSlots[idx];
    newSlots.splice(idx, 1);
    newSlots.unshift(target);
    setImageSlots(newSlots);
  };

  const addImageSlot = () => {
    setImageSlots([...imageSlots, '']);
  };

  // Bulk action handler
  const handleExecuteBulkAction = async () => {
    if (selectedProductIds.length === 0 || !bulkAction) return;

    setBulkLoading(true);
    try {
      let payload: any = { productIds: selectedProductIds };
      if (bulkAction === 'delete') {
        payload.action = 'bulk_delete';
      } else if (bulkAction === 'status') {
        payload.action = 'bulk_status';
        payload.status = bulkStatusTarget;
      } else if (bulkAction === 'category') {
        payload.action = 'bulk_category';
        payload.categoryId = bulkCategoryTarget || null;
      }

      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setSelectedProductIds([]);
        setBulkAction('');
        loadData();
      }
    } catch (e) {
      console.error('Bulk action error:', e);
    } finally {
      setBulkLoading(false);
    }
  };

  // Filter & Search Logic
  const filteredProducts = products.filter(p => {
    const matchesSearch = !search || 
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.productCode.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase()) ||
      (p.tags && p.tags.toLowerCase().includes(search.toLowerCase()));

    const matchesCategory = selectedCategoryFilter === 'ALL' || p.categoryId === selectedCategoryFilter;
    const matchesBrand = selectedBrandFilter === 'ALL' || p.brandId === selectedBrandFilter;
    
    let matchesStatus = true;
    if (selectedStatusFilter === 'ACTIVE') matchesStatus = p.status === 'ACTIVE';
    else if (selectedStatusFilter === 'DRAFT') matchesStatus = p.status === 'DRAFT';
    else if (selectedStatusFilter === 'DISCONTINUED') matchesStatus = p.status === 'DISCONTINUED';
    else if (selectedStatusFilter === 'LOW_STOCK') matchesStatus = p.stock <= 10 && p.stock > 0;
    else if (selectedStatusFilter === 'OUT_OF_STOCK') matchesStatus = p.stock <= 0;

    let matchesBadge = true;
    if (selectedBadgeFilter === 'FEATURED') matchesBadge = Boolean(p.isFeatured);
    else if (selectedBadgeFilter === 'NEW') matchesBadge = Boolean(p.isNew);
    else if (selectedBadgeFilter === 'BESTSELLER') matchesBadge = Boolean(p.isBestseller);
    else if (selectedBadgeFilter === 'SALE') matchesBadge = Boolean(p.isSale);

    return matchesSearch && matchesCategory && matchesBrand && matchesStatus && matchesBadge;
  }).sort((a, b) => {
    if (sortBy === 'newest') return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    if (sortBy === 'price-asc') return a.singlePrice - b.singlePrice;
    if (sortBy === 'price-desc') return b.singlePrice - a.singlePrice;
    if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
    if (sortBy === 'stock-asc') return a.stock - b.stock;
    if (sortBy === 'orderIndex') return (a.orderIndex || 0) - (b.orderIndex || 0);
    return 0;
  });

  const toggleSelectAll = () => {
    if (selectedProductIds.length === filteredProducts.length) {
      setSelectedProductIds([]);
    } else {
      setSelectedProductIds(filteredProducts.map(p => p.id));
    }
  };

  const toggleSelectProduct = (id: string) => {
    if (selectedProductIds.includes(id)) {
      setSelectedProductIds(selectedProductIds.filter(x => x !== id));
    } else {
      setSelectedProductIds([...selectedProductIds, id]);
    }
  };

  const handleDeleteProduct = async () => {
    if (!deleteCandidate) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/products/${deleteCandidate.id}`, { method: 'DELETE' });
      if (res.ok) {
        setDeleteCandidate(null);
        setDeleteConfirmText('');
        loadData();
      }
    } catch (e) {
      console.error('Delete error:', e);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Products Management</h1>
            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono font-bold uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Live Real-Time Sync</span>
            </span>
          </div>
          <p className="text-xs text-white/50 mt-1">
            Manage your full inventory catalog, pricing tiers, 5-slot image galleries, specs, and SEO with instant live saving.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={openAddModal}
            className="bg-[#C21875] hover:bg-[#A31260] text-white px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5 shadow-lg shadow-[#C21875]/25 transition-all cursor-pointer"
          >
            <Plus size={16} />
            <span>Add New Product</span>
          </button>
        </div>
      </div>

      {/* 2. Filters & Search Strip */}
      <div className="bg-[#191019] border border-white/5 p-4 rounded-2xl space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          
          {/* Search input */}
          <div className="lg:col-span-2 relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, SKU, code, tag..."
              className="w-full bg-[#120a12] border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#C21875]"
            />
          </div>

          {/* Category filter */}
          <div>
            <select
              value={selectedCategoryFilter}
              onChange={(e) => setSelectedCategoryFilter(e.target.value)}
              className="w-full bg-[#120a12] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#C21875]"
            >
              <option value="ALL">All Categories</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Brand filter */}
          <div>
            <select
              value={selectedBrandFilter}
              onChange={(e) => setSelectedBrandFilter(e.target.value)}
              className="w-full bg-[#120a12] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#C21875]"
            >
              <option value="ALL">All Brands</option>
              {brands.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>

          {/* Stock / Status filter */}
          <div>
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="w-full bg-[#120a12] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#C21875]"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active (Published)</option>
              <option value="DRAFT">Draft</option>
              <option value="DISCONTINUED">Discontinued</option>
              <option value="LOW_STOCK">Low Stock (≤10)</option>
              <option value="OUT_OF_STOCK">Out of Stock (0)</option>
            </select>
          </div>

          {/* Sort By */}
          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full bg-[#120a12] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#C21875]"
            >
              <option value="newest">Newest First</option>
              <option value="orderIndex">Catalog Position</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="name-asc">Alphabetical</option>
              <option value="stock-asc">Lowest Stock</option>
            </select>
          </div>

        </div>

        {/* Badge Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-[10px] font-mono uppercase text-white/40 font-bold">Badges:</span>
          {['ALL', 'FEATURED', 'NEW', 'BESTSELLER', 'SALE'].map(badge => (
            <button
              key={badge}
              onClick={() => setSelectedBadgeFilter(badge)}
              className={`text-[10px] font-bold px-2.5 py-1 rounded-lg transition-colors uppercase font-mono ${
                selectedBadgeFilter === badge
                  ? 'bg-[#C21875] text-white'
                  : 'bg-white/5 text-white/60 hover:bg-white/10'
              }`}
            >
              {badge}
            </button>
          ))}
          <span className="text-white/30 text-xs ml-auto">
            Showing {filteredProducts.length} of {products.length} products
          </span>
        </div>
      </div>

      {/* 3. Bulk Action Bar */}
      {selectedProductIds.length > 0 && (
        <div className="bg-[#211421] border border-[#C21875]/40 p-3.5 rounded-2xl flex flex-wrap items-center justify-between gap-3 animate-fade-in shadow-xl">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#C21875] animate-ping" />
            <span className="text-xs font-bold text-white font-mono">
              {selectedProductIds.length} Products Selected
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={bulkAction}
              onChange={(e) => setBulkAction(e.target.value)}
              className="bg-[#120a12] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none"
            >
              <option value="">Choose Bulk Action...</option>
              <option value="status">Change Status</option>
              <option value="category">Assign Category</option>
              <option value="delete">Delete Selected</option>
            </select>

            {bulkAction === 'status' && (
              <select
                value={bulkStatusTarget}
                onChange={(e) => setBulkStatusTarget(e.target.value)}
                className="bg-[#120a12] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="DRAFT">DRAFT</option>
                <option value="DISCONTINUED">DISCONTINUED</option>
              </select>
            )}

            {bulkAction === 'category' && (
              <select
                value={bulkCategoryTarget}
                onChange={(e) => setBulkCategoryTarget(e.target.value)}
                className="bg-[#120a12] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white"
              >
                <option value="">Uncategorized</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            )}

            <button
              onClick={handleExecuteBulkAction}
              disabled={!bulkAction || bulkLoading}
              className="bg-[#C21875] hover:bg-[#A31260] disabled:opacity-50 text-white font-bold text-xs px-3.5 py-1.5 rounded-lg transition-colors flex items-center space-x-1"
            >
              {bulkLoading && <Loader2 size={12} className="animate-spin" />}
              <span>Apply</span>
            </button>

            <button
              onClick={() => setSelectedProductIds([])}
              className="text-xs text-white/50 hover:text-white px-2"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* 4. Products Table */}
      <div className="bg-[#191019] border border-white/5 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-white/5 bg-[#140d14] text-white/40 uppercase font-mono tracking-wider text-[10px]">
                <th className="py-3 px-4 w-8">
                  <button onClick={toggleSelectAll} className="text-white/60 hover:text-white">
                    {selectedProductIds.length === filteredProducts.length && filteredProducts.length > 0 ? (
                      <CheckSquare size={16} className="text-[#C21875]" />
                    ) : (
                      <Square size={16} />
                    )}
                  </button>
                </th>
                <th className="py-3 px-2">Image</th>
                <th className="py-3 px-3">Product Name & Code</th>
                <th className="py-3 px-3">Category / Brand</th>
                <th className="py-3 px-3 text-right">Price</th>
                <th className="py-3 px-3 text-center">Stock</th>
                <th className="py-3 px-3 text-center">Badges</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-white/40 italic">
                    No products found matching your search and filter criteria.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((prod) => {
                  const isSelected = selectedProductIds.includes(prod.id);
                  const firstImage = getProductImage(prod);

                  return (
                    <tr 
                      key={prod.id} 
                      className={`hover:bg-white/[0.02] transition-colors ${isSelected ? 'bg-[#C21875]/5' : ''}`}
                    >
                      {/* Checkbox */}
                      <td className="py-3 px-4">
                        <button onClick={() => toggleSelectProduct(prod.id)} className="text-white/60 hover:text-white">
                          {isSelected ? (
                            <CheckSquare size={16} className="text-[#C21875]" />
                          ) : (
                            <Square size={16} />
                          )}
                        </button>
                      </td>

                      {/* Product Thumbnail */}
                      <td className="py-3 px-2">
                        <div className="w-12 h-12 rounded-xl bg-[#120a12] border border-white/10 overflow-hidden relative flex items-center justify-center shrink-0">
                          {firstImage ? (
                            <Image 
                              src={firstImage} 
                              alt={prod.name} 
                              fill 
                              sizes="48px"
                              className="object-cover"
                            />
                          ) : (
                            <ImageIcon size={18} className="text-white/20" />
                          )}
                        </div>
                      </td>

                      {/* Name & Code */}
                      <td className="py-3 px-3">
                        <span className="font-bold text-white block text-xs hover:text-[#C21875] transition-colors cursor-pointer" onClick={() => openEditModal(prod)}>
                          {prod.name}
                        </span>
                        <div className="flex items-center space-x-2 text-[10px] text-white/40 font-mono mt-0.5">
                          <span className="text-[#D6B36A] font-bold">{prod.productCode}</span>
                          <span>•</span>
                          <span>SKU: {prod.sku}</span>
                        </div>
                      </td>

                      {/* Category & Brand */}
                      <td className="py-3 px-3">
                        <span className="text-white/80 block text-xs font-medium truncate max-w-[130px]">
                          {prod.category?.name || 'Uncategorized'}
                        </span>
                        {prod.brand && (
                          <span className="text-[10px] text-white/40 block font-mono">
                            {prod.brand.name}
                          </span>
                        )}
                      </td>

                      {/* Price */}
                      <td className="py-3 px-3 text-right">
                        <div className="font-mono font-bold text-white">
                          ${prod.singlePrice.toFixed(2)}
                        </div>
                        {prod.salePrice && (
                          <div className="text-[10px] text-emerald-400 font-mono line-through opacity-75">
                            Sale: ${prod.salePrice.toFixed(2)}
                          </div>
                        )}
                      </td>

                      {/* Stock */}
                      <td className="py-3 px-3 text-center">
                        <span className={`font-mono font-bold text-xs ${
                          prod.stock <= 0 ? 'text-red-400' : prod.stock <= 10 ? 'text-amber-400' : 'text-white/80'
                        }`}>
                          {prod.stock}
                        </span>
                        <span className="text-[9px] text-white/40 block">{prod.unit || 'pcs'}</span>
                      </td>

                      {/* Badges */}
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center space-x-1">
                          <button
                            onClick={() => handleInlineToggle(prod, 'isFeatured')}
                            title={prod.isFeatured ? "Featured (Click to disable)" : "Click to feature"}
                            disabled={togglingProductId === prod.id}
                            className={`p-1 rounded transition-transform active:scale-95 cursor-pointer ${
                              prod.isFeatured ? 'bg-[#C21875]/20 text-[#C21875]' : 'bg-white/5 text-white/20 hover:text-white/50'
                            }`}
                          >
                            <Sparkles size={11} />
                          </button>
                          <button
                            onClick={() => handleInlineToggle(prod, 'isBestseller')}
                            title={prod.isBestseller ? "Bestseller (Click to disable)" : "Click to mark bestseller"}
                            disabled={togglingProductId === prod.id}
                            className={`p-1 rounded transition-transform active:scale-95 cursor-pointer ${
                              prod.isBestseller ? 'bg-amber-500/20 text-amber-400' : 'bg-white/5 text-white/20 hover:text-white/50'
                            }`}
                          >
                            <Flame size={11} />
                          </button>
                          <button
                            onClick={() => handleInlineToggle(prod, 'isNew')}
                            title={prod.isNew ? "New Arrival (Click to disable)" : "Click to mark as New"}
                            disabled={togglingProductId === prod.id}
                            className={`px-1.5 py-0.5 rounded text-[8px] font-bold font-mono transition-transform active:scale-95 cursor-pointer ${
                              prod.isNew ? 'bg-blue-500/20 text-blue-400' : 'bg-white/5 text-white/20 hover:text-white/50'
                            }`}
                          >
                            NEW
                          </button>
                          <button
                            onClick={() => handleInlineToggle(prod, 'isSale')}
                            title={prod.isSale ? "On Sale (Click to disable)" : "Click to mark as Sale"}
                            disabled={togglingProductId === prod.id}
                            className={`px-1.5 py-0.5 rounded text-[8px] font-bold font-mono transition-transform active:scale-95 cursor-pointer ${
                              prod.isSale ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-white/20 hover:text-white/50'
                            }`}
                          >
                            %
                          </button>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => handleInlineToggle(prod, 'status')}
                          title="Click to toggle Active / Draft"
                          disabled={togglingProductId === prod.id}
                          className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider font-mono border transition-all active:scale-95 cursor-pointer ${
                            prod.status === 'ACTIVE' 
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20' 
                              : prod.status === 'DRAFT'
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20'
                              : 'bg-red-500/10 text-red-400 border-red-500/20'
                          }`}
                        >
                          {prod.status}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          <Link
                            href={`/product/${prod.slug}`}
                            target="_blank"
                            title="Preview on storefront"
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white"
                          >
                            <ExternalLink size={13} />
                          </Link>
                          <button
                            onClick={() => handleDuplicate(prod)}
                            title="Duplicate product"
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[#D6B36A]"
                          >
                            <Copy size={13} />
                          </button>
                          <button
                            onClick={() => openEditModal(prod)}
                            title="Edit product"
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-[#C21875] text-white"
                          >
                            <Edit size={13} />
                          </button>
                          <button
                            onClick={() => { setDeleteCandidate(prod); setDeleteConfirmText(''); }}
                            title="Delete product"
                            className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. ADD / EDIT PRODUCT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#191019] border border-white/10 w-full max-w-4xl max-h-[90vh] rounded-3xl overflow-hidden shadow-2xl flex flex-col">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-[#140d14]">
              <div>
                <h3 className="text-base font-bold text-white">
                  {editingProduct ? `Edit Product: ${editingProduct.name}` : 'Create New Product'}
                </h3>
                <p className="text-[11px] text-white/40">Manage catalog information, 5+ image gallery slots, pricing tiers, and SEO.</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-white/60 hover:text-white">
                <X size={20} />
              </button>
            </div>

            {/* Modal Navigation Tabs */}
            <div className="flex border-b border-white/5 px-6 bg-[#160e16] overflow-x-auto">
              {[
                { id: 'general', label: '1. General Info' },
                { id: 'images', label: '2. Multi-Image Gallery (5+ Slots)' },
                { id: 'pricing', label: '3. Pricing & Inventory' },
                { id: 'specs', label: '4. Specs & Material' },
                { id: 'badges', label: '5. Badges & Badging' },
                { id: 'seo', label: '6. SEO & Meta' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-4 py-3 text-xs font-bold uppercase tracking-wider transition-colors shrink-0 border-b-2 ${
                    activeTab === tab.id
                      ? 'border-[#C21875] text-[#C21875]'
                      : 'border-transparent text-white/50 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSaveProduct} className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* TAB 1: General Info */}
              {activeTab === 'general' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-white/70 block mb-1">Product Name *</label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Mega Volume 75° Boot Lash Tweezer"
                        className="w-full bg-[#120a12] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:border-[#C21875] focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs font-semibold text-white/70 block mb-1">Product Code</label>
                        <input
                          type="text"
                          value={productCode}
                          onChange={(e) => setProductCode(e.target.value)}
                          placeholder="Auto-generated (LTL-101)"
                          className="w-full bg-[#120a12] border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-[#C21875] focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-white/70 block mb-1">SKU</label>
                        <input
                          type="text"
                          value={sku}
                          onChange={(e) => setSku(e.target.value)}
                          placeholder="Auto-generated (SKU-101)"
                          className="w-full bg-[#120a12] border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-[#C21875] focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-white/70 block mb-1">Category</label>
                      <select
                        value={categoryId}
                        onChange={(e) => setCategoryId(e.target.value)}
                        className="w-full bg-[#120a12] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:border-[#C21875] focus:outline-none"
                      >
                        <option value="">-- No Category --</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-white/70 block mb-1">Brand</label>
                      <select
                        value={brandId}
                        onChange={(e) => setBrandId(e.target.value)}
                        className="w-full bg-[#120a12] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:border-[#C21875] focus:outline-none"
                      >
                        <option value="">-- No Brand --</option>
                        {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-white/70 block mb-1">Publish Status</label>
                      <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="w-full bg-[#120a12] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:border-[#C21875] focus:outline-none"
                      >
                        <option value="ACTIVE">ACTIVE (Published)</option>
                        <option value="DRAFT">DRAFT (Hidden)</option>
                        <option value="DISCONTINUED">DISCONTINUED</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-white/70 block mb-1">Short Description (Summary)</label>
                    <input
                      type="text"
                      value={shortDescription}
                      onChange={(e) => setShortDescription(e.target.value)}
                      placeholder="Brief punchy summary shown in product cards"
                      className="w-full bg-[#120a12] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:border-[#C21875] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-white/70 block mb-1">Full Detailed Description</label>
                    <textarea
                      rows={4}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Comprehensive product details, tips for lash artists, ergonomics, etc."
                      className="w-full bg-[#120a12] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:border-[#C21875] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-white/70 block mb-1">Tags (Comma separated)</label>
                    <input
                      type="text"
                      value={tags}
                      onChange={(e) => setTags(e.target.value)}
                      placeholder="volume lash, mega 75, diamond grip, sialkot"
                      className="w-full bg-[#120a12] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:border-[#C21875] focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* TAB 2: Multi-Image Gallery with 5+ Slots */}
              {activeTab === 'images' && (
                <div className="space-y-6">
                  <div className="bg-[#120a12] p-4 rounded-2xl border border-white/5 flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[#D6B36A]">Multi-Image Gallery Slots</h4>
                      <p className="text-[11px] text-white/40 mt-0.5">
                        Slot 1 is the Primary Image. Upload images directly, pick from Media Library, or type URL.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={addImageSlot}
                      className="bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg text-xs font-semibold text-white/80 hover:text-white transition-colors"
                    >
                      + Add Image Slot
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {imageSlots.map((url, idx) => (
                      <div 
                        key={idx} 
                        className={`bg-[#140d14] border rounded-2xl p-3.5 space-y-3 relative ${
                          idx === 0 ? 'border-[#C21875]' : 'border-white/10'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono uppercase font-bold text-white/60 flex items-center space-x-1.5">
                            <span>Image {idx + 1}</span>
                            {idx === 0 && (
                              <span className="bg-[#C21875] text-white text-[9px] px-1.5 py-0.5 rounded font-bold">
                                PRIMARY
                              </span>
                            )}
                          </span>

                          <div className="flex items-center space-x-1">
                            {idx > 0 && url && (
                              <button
                                type="button"
                                onClick={() => setPrimarySlotImage(idx)}
                                title="Make Primary"
                                className="text-[9px] text-[#D6B36A] hover:underline font-bold"
                              >
                                Set Primary
                              </button>
                            )}
                            {url && (
                              <button
                                type="button"
                                onClick={() => removeSlotImage(idx)}
                                className="text-red-400 hover:text-red-300 text-[10px]"
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Image Preview Box */}
                        <div className="w-full h-36 rounded-xl bg-[#120a12] border border-white/5 overflow-hidden relative flex items-center justify-center group">
                          {url ? (
                            <>
                              <Image 
                                src={url} 
                                alt={`Slot ${idx + 1}`} 
                                fill 
                                sizes="200px"
                                className="object-cover group-hover:scale-105 transition-transform"
                              />
                              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                                <button
                                  type="button"
                                  onClick={() => { setTargetSlotIndex(idx); loadMediaLibrary(); setShowMediaPicker(true); }}
                                  className="p-1.5 bg-[#C21875] text-white rounded-lg text-xs font-bold"
                                >
                                  Replace
                                </button>
                              </div>
                            </>
                          ) : (
                            <div className="flex flex-col items-center justify-center space-y-1.5 text-white/30">
                              <ImageIcon size={24} />
                              <span className="text-[10px]">No image assigned</span>
                            </div>
                          )}
                        </div>

                        {/* Slot Inputs / Buttons */}
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={url}
                            onChange={(e) => {
                              const newSlots = [...imageSlots];
                              newSlots[idx] = e.target.value;
                              setImageSlots(newSlots);
                            }}
                            placeholder="Image URL (/products/...)"
                            className="w-full bg-[#120a12] border border-white/10 rounded-lg px-2.5 py-1.5 text-[11px] text-white font-mono focus:border-[#C21875] focus:outline-none"
                          />

                          <div className="grid grid-cols-2 gap-1.5">
                            <label className="bg-white/5 hover:bg-white/10 text-white/80 hover:text-white px-2 py-1 rounded-lg text-[10px] font-bold text-center cursor-pointer transition-colors block">
                              <Upload size={11} className="inline mr-1" />
                              Upload
                              <input 
                                type="file" 
                                accept="image/*" 
                                className="hidden" 
                                onChange={(e) => handleUploadImageFile(e, idx)} 
                              />
                            </label>

                            <button
                              type="button"
                              onClick={() => { setTargetSlotIndex(idx); loadMediaLibrary(); setShowMediaPicker(true); }}
                              className="bg-white/5 hover:bg-white/10 text-[#D6B36A] hover:text-white px-2 py-1 rounded-lg text-[10px] font-bold text-center transition-colors"
                            >
                              <Sparkles size={11} className="inline mr-1" />
                              Library
                            </button>
                          </div>
                        </div>

                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 3: Pricing & Inventory */}
              {activeTab === 'pricing' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-white/70 block mb-1">Regular Unit Price ($) *</label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={singlePrice}
                        onChange={(e) => setSinglePrice(e.target.value)}
                        className="w-full bg-[#120a12] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:border-[#C21875] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-white/70 block mb-1">Sale Discount Price ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={salePrice}
                        onChange={(e) => setSalePrice(e.target.value)}
                        placeholder="Leave blank if no sale"
                        className="w-full bg-[#120a12] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:border-[#C21875] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-white/70 block mb-1">Base Wholesale Price ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={wholesalePrice}
                        onChange={(e) => setWholesalePrice(e.target.value)}
                        placeholder="For B2B bulk buyers"
                        className="w-full bg-[#120a12] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:border-[#C21875] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-white/70 block mb-1">Stock Quantity</label>
                      <input
                        type="number"
                        value={stock}
                        onChange={(e) => setStock(e.target.value)}
                        className="w-full bg-[#120a12] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:border-[#C21875] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-white/70 block mb-1">Minimum Order Qty (MOQ)</label>
                      <input
                        type="number"
                        value={moq}
                        onChange={(e) => setMoq(e.target.value)}
                        className="w-full bg-[#120a12] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:border-[#C21875] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-white/70 block mb-1">Unit of Measure</label>
                      <select
                        value={unit}
                        onChange={(e) => setUnit(e.target.value)}
                        className="w-full bg-[#120a12] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:border-[#C21875] focus:outline-none"
                      >
                        <option value="Piece">Piece (pc)</option>
                        <option value="Pair">Pair</option>
                        <option value="Set">Set</option>
                        <option value="Kit">Kit</option>
                        <option value="Box">Box</option>
                      </select>
                    </div>
                  </div>

                  {/* Pricing Tiers Table */}
                  <div className="bg-[#140d14] border border-white/5 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[#D6B36A]">
                        B2B Wholesale Quantity Pricing Tiers
                      </h4>
                      <button
                        type="button"
                        onClick={() => setPricingTiers([...pricingTiers, { minQuantity: 10, pricePerUnit: 0 }])}
                        className="text-xs text-[#C21875] hover:underline font-bold"
                      >
                        + Add Tier
                      </button>
                    </div>

                    {pricingTiers.length === 0 ? (
                      <p className="text-[11px] text-white/40 italic">No tiered pricing configured for this product.</p>
                    ) : (
                      <div className="space-y-2">
                        {pricingTiers.map((tier, tIdx) => (
                          <div key={tIdx} className="flex items-center space-x-3">
                            <span className="text-xs text-white/60">Min Qty:</span>
                            <input
                              type="number"
                              value={tier.minQuantity}
                              onChange={(e) => {
                                const copy = [...pricingTiers];
                                copy[tIdx].minQuantity = parseInt(e.target.value, 10) || 0;
                                setPricingTiers(copy);
                              }}
                              className="w-24 bg-[#120a12] border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white font-mono"
                            />
                            <span className="text-xs text-white/60">Price/Unit ($):</span>
                            <input
                              type="number"
                              step="0.01"
                              value={tier.pricePerUnit}
                              onChange={(e) => {
                                const copy = [...pricingTiers];
                                copy[tIdx].pricePerUnit = parseFloat(e.target.value) || 0;
                                setPricingTiers(copy);
                              }}
                              className="w-28 bg-[#120a12] border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white font-mono"
                            />
                            <button
                              type="button"
                              onClick={() => setPricingTiers(pricingTiers.filter((_, i) => i !== tIdx))}
                              className="text-red-400 hover:text-red-300"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 4: Specs & Physical Details */}
              {activeTab === 'specs' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-white/70 block mb-1">Material Composition</label>
                    <input
                      type="text"
                      value={material}
                      onChange={(e) => setMaterial(e.target.value)}
                      placeholder="e.g. Japanese 440C Cobalt Stainless Steel"
                      className="w-full bg-[#120a12] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:border-[#C21875] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-white/70 block mb-1">Size / Length</label>
                    <input
                      type="text"
                      value={size}
                      onChange={(e) => setSize(e.target.value)}
                      placeholder="e.g. 12cm / 4.75 inches"
                      className="w-full bg-[#120a12] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:border-[#C21875] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-white/70 block mb-1">Finish / Coating</label>
                    <input
                      type="text"
                      value={finish}
                      onChange={(e) => setFinish(e.target.value)}
                      placeholder="e.g. Matte Plasma Rose Gold / Satin Sandblast"
                      className="w-full bg-[#120a12] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:border-[#C21875] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-white/70 block mb-1">Weight / Tension</label>
                    <input
                      type="text"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      placeholder="e.g. 18 grams / Light Feather Tension"
                      className="w-full bg-[#120a12] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:border-[#C21875] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-white/70 block mb-1">Color Variant</label>
                    <input
                      type="text"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      placeholder="e.g. Titanium Rainbow, Rose Gold, Matte Black"
                      className="w-full bg-[#120a12] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:border-[#C21875] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-white/70 block mb-1">Product Demo Video URL</label>
                    <input
                      type="text"
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                      placeholder="https://youtube.com/watch?v=..."
                      className="w-full bg-[#120a12] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:border-[#C21875] focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* TAB 5: Badges & Positioning */}
              {activeTab === 'badges' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <label className="flex items-center space-x-2 bg-[#140d14] p-3.5 rounded-xl border border-white/5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isFeatured}
                        onChange={(e) => setIsFeatured(e.target.checked)}
                        className="rounded text-[#C21875]"
                      />
                      <span className="text-xs font-bold text-white">Featured Product</span>
                    </label>

                    <label className="flex items-center space-x-2 bg-[#140d14] p-3.5 rounded-xl border border-white/5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isNew}
                        onChange={(e) => setIsNew(e.target.checked)}
                        className="rounded text-[#C21875]"
                      />
                      <span className="text-xs font-bold text-white">New Arrival</span>
                    </label>

                    <label className="flex items-center space-x-2 bg-[#140d14] p-3.5 rounded-xl border border-white/5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isBestseller}
                        onChange={(e) => setIsBestseller(e.target.checked)}
                        className="rounded text-[#C21875]"
                      />
                      <span className="text-xs font-bold text-white">Bestseller</span>
                    </label>

                    <label className="flex items-center space-x-2 bg-[#140d14] p-3.5 rounded-xl border border-white/5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isSale}
                        onChange={(e) => setIsSale(e.target.checked)}
                        className="rounded text-[#C21875]"
                      />
                      <span className="text-xs font-bold text-white">On Sale</span>
                    </label>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-white/70 block mb-1">Catalog Order Index (Position)</label>
                    <input
                      type="number"
                      value={orderIndex}
                      onChange={(e) => setOrderIndex(e.target.value)}
                      placeholder="0 (Lower numbers appear first)"
                      className="w-full max-w-xs bg-[#120a12] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:border-[#C21875] focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* TAB 6: SEO Settings */}
              {activeTab === 'seo' && (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-white/70 block mb-1">SEO Meta Title</label>
                    <input
                      type="text"
                      value={seoTitle}
                      onChange={(e) => setSeoTitle(e.target.value)}
                      placeholder="e.g. Master Mega Volume Lash Tweezer | Handcrafted Sialkot"
                      className="w-full bg-[#120a12] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:border-[#C21875] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-white/70 block mb-1">SEO Meta Description</label>
                    <textarea
                      rows={3}
                      value={seoDescription}
                      onChange={(e) => setSeoDescription(e.target.value)}
                      placeholder="Brief search engine snippet describing precision grip and sweet spot."
                      className="w-full bg-[#120a12] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:border-[#C21875] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-white/70 block mb-1">SEO Meta Keywords</label>
                    <input
                      type="text"
                      value={seoKeywords}
                      onChange={(e) => setSeoKeywords(e.target.value)}
                      placeholder="lash tweezers, volume tweezers, hand-tested, Sialkot exporter"
                      className="w-full bg-[#120a12] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:border-[#C21875] focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Modal Footer Buttons */}
              <div className="pt-4 border-t border-white/5 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-white/60 hover:text-white bg-white/5 hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-wider text-white bg-[#C21875] hover:bg-[#A31260] shadow-lg shadow-[#C21875]/25 transition-all"
                >
                  {editingProduct ? 'Update Product' : 'Save & Publish Product'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* 6. MEDIA LIBRARY PICKER MODAL */}
      {showMediaPicker && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#191019] border border-white/10 w-full max-w-3xl max-h-[85vh] rounded-3xl overflow-hidden shadow-2xl flex flex-col">
            
            <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-[#140d14]">
              <div>
                <h3 className="text-sm font-bold text-white">Select from Media Library</h3>
                <p className="text-[10px] text-white/40">Choose an image from uploaded catalog assets</p>
              </div>
              <button onClick={() => setShowMediaPicker(false)} className="text-white/60 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="p-4 border-b border-white/5">
              <input
                type="text"
                value={mediaSearch}
                onChange={(e) => setMediaSearch(e.target.value)}
                placeholder="Search media files..."
                className="w-full bg-[#120a12] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white placeholder-white/40 focus:outline-none"
              />
            </div>

            <div className="flex-1 overflow-y-auto p-4 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {mediaList
                .filter(m => !mediaSearch || m.fileName.toLowerCase().includes(mediaSearch.toLowerCase()))
                .map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      if (targetSlotIndex !== null) {
                        const newSlots = [...imageSlots];
                        newSlots[targetSlotIndex] = item.fileUrl;
                        setImageSlots(newSlots);
                      }
                      setShowMediaPicker(false);
                    }}
                    className="group relative aspect-square rounded-xl bg-[#120a12] border border-white/10 overflow-hidden hover:border-[#C21875] transition-all flex items-center justify-center"
                  >
                    <Image 
                      src={item.fileUrl} 
                      alt={item.fileName} 
                      fill 
                      sizes="120px"
                      className="object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-1 text-center">
                      <span className="text-[9px] text-white font-bold truncate max-w-full">{item.fileName}</span>
                    </div>
                  </button>
                ))}
            </div>

          </div>
        </div>
      )}

      {/* 7. SAFE DELETE CONFIRMATION MODAL */}
      {deleteCandidate && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#191019] border border-red-500/30 w-full max-w-md rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center space-x-3 text-red-400">
              <ShieldAlert size={28} />
              <h3 className="text-base font-bold text-white">Confirm Product Deletion</h3>
            </div>

            <p className="text-xs text-white/70 leading-relaxed">
              Are you sure you want to permanently delete <strong className="text-white">{deleteCandidate.name}</strong> ({deleteCandidate.productCode})?
              This will remove its pricing tiers and catalog references.
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
                onClick={handleDeleteProduct}
                disabled={isDeleting}
                className="px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider text-white bg-red-600 hover:bg-red-700 transition-colors flex items-center space-x-1.5"
              >
                {isDeleting && <Loader2 size={13} className="animate-spin" />}
                <span>Delete Permanently</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
