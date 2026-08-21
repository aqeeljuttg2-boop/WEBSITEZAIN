'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, ChevronDown, SlidersHorizontal, RefreshCcw } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  slug: string;
  subcategories?: Category[];
}

interface SearchFilterWrapperProps {
  categories: Category[];
  currentCategory: string;
  currentSearch: string;
  currentMinPrice: string;
  currentMaxPrice: string;
  currentMaterial: string;
  currentFinish: string;
  currentMoq: string;
  currentSort: string;
}

export default function SearchFilterWrapper({
  categories,
  currentCategory,
  currentSearch,
  currentMinPrice,
  currentMaxPrice,
  currentMaterial,
  currentFinish,
  currentMoq,
  currentSort,
}: SearchFilterWrapperProps) {
  const router = useRouter();

  // Search states
  const [search, setSearch] = useState(currentSearch);
  const [minPrice, setMinPrice] = useState(currentMinPrice);
  const [maxPrice, setMaxPrice] = useState(currentMaxPrice);
  const [material, setMaterial] = useState(currentMaterial);
  const [finish, setFinish] = useState(currentFinish);
  const [sort, setSort] = useState(currentSort);
  const [isOpenMobile, setIsOpenMobile] = useState(false);

  const handleApplyFilters = () => {
    const qParams = new URLSearchParams();
    
    if (currentCategory) qParams.set('category', currentCategory);
    if (search.trim()) qParams.set('search', search.trim());
    if (minPrice) qParams.set('minPrice', minPrice);
    if (maxPrice) qParams.set('maxPrice', maxPrice);
    if (material) qParams.set('material', material);
    if (finish) qParams.set('finish', finish);
    if (sort) qParams.set('sort', sort);
    
    router.push(`/shop?${qParams.toString()}`);
  };

  const handleClearFilters = () => {
    setSearch('');
    setMinPrice('');
    setMaxPrice('');
    setMaterial('');
    setFinish('');
    setSort('newest');
    router.push('/shop');
  };

  return (
    <div className="space-y-6 text-sm text-gray-800">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-4">
        <span className="font-extrabold flex items-center space-x-2 text-[#C21875]">
          <SlidersHorizontal size={16} />
          <span className="uppercase tracking-wider text-xs font-mono">Filter Catalog</span>
        </span>
        <div className="flex items-center space-x-2 shrink-0">
          <button 
            onClick={handleClearFilters}
            className="text-xs text-gray-400 hover:text-[#C21875] flex items-center space-x-1 font-medium transition-colors"
          >
            <RefreshCcw size={11} />
            <span>Reset</span>
          </button>
          <button 
            onClick={() => setIsOpenMobile(!isOpenMobile)}
            className="lg:hidden text-[10px] uppercase tracking-wider font-bold bg-[#C21875] text-white hover:bg-[#A31260] px-3 py-1.5 rounded transition-all shrink-0"
          >
            {isOpenMobile ? 'Hide' : 'Filters'}
          </button>
        </div>
      </div>

      {/* Collapsible filters block */}
      <div className={`${isOpenMobile ? 'block' : 'hidden lg:block'} space-y-6`}>

        {/* Sorting */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase font-mono tracking-wider text-gray-600">Sort Products</label>
          <select
            value={sort}
            onChange={(e) => {
              setSort(e.target.value);
              const q = new URLSearchParams(window.location.search);
              q.set('sort', e.target.value);
              router.push(`/shop?${q.toString()}`);
            }}
            className="w-full bg-gray-50 border border-gray-300 hover:border-[#C21875] text-xs px-3 py-2.5 rounded-lg focus:outline-none focus:border-[#C21875] text-gray-800 font-medium"
          >
            <option value="newest">Newest Arrivals</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="name-asc">Name: A to Z</option>
            <option value="name-desc">Name: Z to A</option>
            <option value="popular">Best Selling / Top Stock</option>
          </select>
        </div>

        {/* Search Filter */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase font-mono tracking-wider text-gray-600">Keyword Search</label>
          <div className="relative">
            <input
              type="text"
              placeholder="e.g. Mic4-001, Slanted, 440C..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleApplyFilters()}
              className="w-full bg-gray-50 border border-gray-300 text-xs px-3 py-2.5 pr-8 rounded-lg focus:outline-none focus:border-[#C21875] text-gray-800"
            />
            <button onClick={handleApplyFilters} className="absolute right-2.5 top-3 text-gray-400 hover:text-[#C21875]">
              <Search size={14} />
            </button>
          </div>
        </div>

        {/* Categories Accordion */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase font-mono tracking-wider text-gray-600">Product Categories</label>
          <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
            <Link
              href="/shop"
              className={`block py-1.5 px-2.5 rounded-md text-xs font-bold transition-colors ${
                !currentCategory 
                  ? 'bg-pink-50 text-[#C21875] font-extrabold' 
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              All Categories
            </Link>
            {categories.map((cat) => {
              const isParentActive = currentCategory === cat.slug;
              return (
                <div key={cat.id} className="space-y-0.5">
                  <Link
                    href={`/shop?category=${cat.slug}&sort=${sort}`}
                    className={`block py-1.5 px-2.5 rounded-md text-xs transition-colors ${
                      isParentActive 
                        ? 'bg-pink-50 text-[#C21875] font-extrabold' 
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 font-semibold'
                    }`}
                  >
                    {cat.name}
                  </Link>
                  {cat.subcategories && cat.subcategories.map((sub) => {
                    const isSubActive = currentCategory === sub.slug;
                    return (
                      <Link
                        key={sub.id}
                        href={`/shop?category=${sub.slug}&sort=${sort}`}
                        className={`block pl-6 py-1 pr-2 rounded-md text-[11px] transition-colors ${
                          isSubActive 
                            ? 'text-[#C21875] font-extrabold bg-pink-50/70' 
                            : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                        }`}
                      >
                        └─ {sub.name}
                      </Link>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>

        {/* Price Bounds */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase font-mono tracking-wider text-gray-600">Price Range (Rs.)</label>
          <div className="flex space-x-2">
            <input
              type="number"
              placeholder="Min Rs."
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              className="w-full bg-gray-50 border border-gray-300 text-xs px-2.5 py-2 rounded-lg focus:outline-none focus:border-[#C21875] text-gray-800 font-mono"
            />
            <span className="text-gray-400 self-center">-</span>
            <input
              type="number"
              placeholder="Max Rs."
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="w-full bg-gray-50 border border-gray-300 text-xs px-2.5 py-2 rounded-lg focus:outline-none focus:border-[#C21875] text-gray-800 font-mono"
            />
          </div>
        </div>

        {/* Materials */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase font-mono tracking-wider text-gray-600">Steel Material</label>
          <select
            value={material}
            onChange={(e) => setMaterial(e.target.value)}
            className="storefront-select w-full bg-gray-50 border border-gray-300 text-xs px-3 py-2.5 rounded-lg focus:outline-none focus:border-[#C21875] text-gray-800 cursor-pointer"
          >
            <option value="" className="bg-white text-gray-800">Any Material</option>
            <option value="Stainless Steel" className="bg-white text-gray-800">Stainless Steel (AISI 420)</option>
            <option value="Japan 440C" className="bg-white text-gray-800">Japan 440C Cobalt Steel</option>
            <option value="Carbon Steel" className="bg-white text-gray-800">Carbon Steel</option>
            <option value="German Stainless" className="bg-white text-gray-800">German Stainless Steel</option>
          </select>
        </div>

        {/* Finish */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase font-mono tracking-wider text-gray-600">Instrument Finish</label>
          <select
            value={finish}
            onChange={(e) => setFinish(e.target.value)}
            className="storefront-select w-full bg-gray-50 border border-gray-300 text-xs px-3 py-2.5 rounded-lg focus:outline-none focus:border-[#C21875] text-gray-800 cursor-pointer"
          >
            <option value="" className="bg-white text-gray-800">Any Finish</option>
            <option value="Satin" className="bg-white text-gray-800">Satin Finish / Matte</option>
            <option value="Mirror" className="bg-white text-gray-800">Mirror Polish</option>
            <option value="Titanium" className="bg-white text-gray-800">Titanium / Plasma Coated</option>
            <option value="Gold Ring" className="bg-white text-gray-800">Gold Ring Accent</option>
          </select>
        </div>

        {/* Apply Button */}
        <button
          onClick={handleApplyFilters}
          className="w-full bg-[#C21875] hover:bg-[#A31260] text-white text-xs font-bold uppercase tracking-wider py-3 rounded-xl transition-all shadow-md cursor-pointer"
        >
          Apply Filters
        </button>

      </div>
    </div>
  );
}
