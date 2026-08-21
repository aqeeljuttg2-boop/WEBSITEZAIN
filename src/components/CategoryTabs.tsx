'use client';

import React, { useState, useMemo } from 'react';
import ProductCard from './ProductCard';
import { Product } from '@/context/CartContext';
import { Sparkles, Layers } from 'lucide-react';
import Link from 'next/link';

interface CategoryItem {
  id: string;
  name: string;
  slug: string;
}

interface CategoryTabsProps {
  categories?: CategoryItem[];
  products: (Product & {
    category?: {
      id?: string;
      name: string;
      slug: string;
    } | null;
  })[];
}

export default function CategoryTabs({ categories, products }: CategoryTabsProps) {
  // Dynamically compute available categories
  const dynamicTabs = useMemo(() => {
    const tabsMap = new Map<string, { id: string; name: string; slug: string; count: number }>();
    
    // First, add all passed database categories
    if (categories && categories.length > 0) {
      categories.forEach(cat => {
        tabsMap.set(cat.slug, { id: cat.id, name: cat.name, slug: cat.slug, count: 0 });
      });
    }

    // Next, count products per category or discover categories present on products
    products.forEach(prod => {
      if (prod.category && prod.category.slug) {
        const existing = tabsMap.get(prod.category.slug);
        if (existing) {
          existing.count += 1;
        } else {
          tabsMap.set(prod.category.slug, {
            id: prod.category.id || prod.category.slug,
            name: prod.category.name,
            slug: prod.category.slug,
            count: 1
          });
        }
      }
    });

    const tabsList = Array.from(tabsMap.values());
    // Put categories that have products first, then others
    return tabsList.sort((a, b) => b.count - a.count);
  }, [categories, products]);

  // Set initial active tab
  const [activeTab, setActiveTab] = useState<string>(() => {
    if (dynamicTabs.length > 0) {
      return dynamicTabs[0].slug;
    }
    return 'all';
  });

  // Automatically adjust active tab if tabs change
  const currentTab = dynamicTabs.some(t => t.slug === activeTab)
    ? activeTab
    : (dynamicTabs.length > 0 ? dynamicTabs[0].slug : 'all');

  // Filter products by selected dynamic tab
  const filteredProducts = useMemo(() => {
    if (currentTab === 'all') {
      return products.slice(0, 10);
    }
    return products.filter((prod) => {
      if (!prod.category) return false;
      return prod.category.slug === currentTab || (prod as any).categoryId === currentTab;
    }).slice(0, 10);
  }, [products, currentTab]);

  return (
    <div className="space-y-10">
      
      {/* Scrollable & Centered Dynamic Category Tabs */}
      <div className="flex justify-center border-b border-gray-200 overflow-x-auto no-scrollbar pb-1">
        <div className="flex space-x-4 md:space-x-8 px-2 min-w-max">
          {dynamicTabs.map((tab) => {
            const isActive = currentTab === tab.slug;
            return (
              <button
                key={tab.slug}
                onClick={() => setActiveTab(tab.slug)}
                className={`pb-4 text-xs md:text-sm font-bold tracking-widest uppercase transition-all duration-200 focus:outline-none border-b-2 cursor-pointer flex items-center space-x-2 ${
                  isActive
                    ? 'border-[#C21875] text-[#C21875]'
                    : 'border-transparent text-gray-400 hover:text-gray-700'
                }`}
              >
                <span>{tab.name}</span>
                {tab.count > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                    isActive ? 'bg-[#C21875] text-white' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-16 bg-gray-50/50 rounded-3xl border border-dashed border-gray-200">
          <Layers size={36} className="mx-auto text-gray-300 mb-3 stroke-[1.2]" />
          <p className="text-gray-500 font-medium text-sm">
            No products assigned to this category yet.
          </p>
          <p className="text-gray-400 text-xs mt-1">
            Add products to this category in the Admin Dashboard to display them here live.
          </p>
          <div className="mt-4">
            <Link
              href="/shop"
              className="inline-flex items-center space-x-1 text-xs font-bold text-[#C21875] hover:underline"
            >
              <span>Explore All Catalog</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {filteredProducts.map((prod) => (
            <ProductCard key={prod.id} product={prod} />
          ))}
        </div>
      )}
    </div>
  );
}
