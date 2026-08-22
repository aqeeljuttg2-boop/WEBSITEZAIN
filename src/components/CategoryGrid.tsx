'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronRight } from 'lucide-react';
import { normalizeImageUrl } from '@/lib/imageResolver';

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  subcategories?: Category[];
  _count?: {
    products: number;
  };
}

interface CategoryGridProps {
  categories: Category[];
}

const categoryImagesMap: Record<string, string> = {
  'eyelash-tweezers': '/catagori/WhatsApp Image 2026-08-18 at 12.28.05 AM (1).jpeg',
  'tweezers-lash-care': '/catagori/WhatsApp Image 2026-08-18 at 12.28.05 AM (1).jpeg',
  'barber-shears': '/catagori/WhatsApp Image 2026-08-18 at 12.28.11 AM.jpeg',
  'hair-styling-shears': '/catagori/WhatsApp Image 2026-08-18 at 12.28.11 AM.jpeg',
  'nail-cuticle-care': '/catagori/WhatsApp Image 2026-08-18 at 12.28.16 AM.jpeg',
  'shaving-grooming': '/catagori/WhatsApp Image 2026-08-18 at 12.28.12 AM.jpeg',
  'beauty-kits-bags': '/catagori/WhatsApp Image 2026-08-18 at 12.28.17 AM (1).jpeg',
  'kits-holsters': '/catagori/WhatsApp Image 2026-08-18 at 12.28.17 AM (1).jpeg'
};

export default function CategoryGrid({ categories }: CategoryGridProps) {
  // If database categories are not loaded, render fallback cosmetics categories
  const displayCategories = categories && categories.length > 0 ? categories : [
    {
      id: 'tweezers',
      name: 'Tweezers & Lash Care',
      slug: 'tweezers-lash-care',
      description: 'Handcrafted eyebrow tweezers, volume extension clamps, and isolation tools.',
      _count: { products: 7 }
    },
    {
      id: 'shears',
      name: 'Hair Styling Shears',
      slug: 'hair-styling-shears',
      description: 'Handcrafted professional barber shears, thinning scissors, and grooming tools.',
      _count: { products: 4 }
    },
    {
      id: 'nailcare',
      name: 'Nail & Cuticle Care',
      slug: 'nail-cuticle-care',
      description: 'Professional cuticle nippers, nail splitters, pushers, and sapphire files.',
      _count: { products: 5 }
    },
    {
      id: 'shaving',
      name: 'Shaving & Grooming',
      slug: 'shaving-grooming',
      description: 'Premium safety razors, synthetic badger brushes, and safety shaving sets.',
      _count: { products: 5 }
    },
    {
      id: 'beauty-kits-bags',
      name: 'Kits & Holsters',
      slug: 'beauty-kits-bags',
      description: 'Professional barber pouches, genuine leather kits, and manicure sets.',
      _count: { products: 2 }
    }
  ];

  return (
    <section className="py-20 bg-white text-gray-800">
      <div className="max-w-7xl mx-auto px-4">
        
        {/* Title */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <span className="text-[#C21875] text-xs font-bold uppercase tracking-widest block">Product Divisions</span>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight uppercase">Shop Categories</h2>
          <p className="text-sm text-gray-500 font-light">
            Browse our export-quality precision lash tweezers, professional barber shears, and grooming instruments.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
          {displayCategories.map((cat: any) => (
            <div 
              key={cat.id} 
              className="group bg-white border border-gray-200 hover:border-[#C21875]/40 rounded-2xl flex flex-col justify-between hover:shadow-xl transition-all duration-300 h-[380px] overflow-hidden"
            >
              {/* Category Image Container */}
              <div className="w-full h-40 overflow-hidden relative bg-gray-100 shrink-0">
                <Image 
                  src={normalizeImageUrl(cat.image || categoryImagesMap[cat.slug] || categoryImagesMap[cat.id])} 
                  alt={cat.name} 
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                  className="object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-60" />
                <span className="absolute bottom-3 left-4 text-[9px] uppercase font-mono tracking-widest text-white bg-[#C21875] px-2 py-0.5 rounded font-bold">
                  {cat._count?.products || 0} Items
                </span>
              </div>

              {/* Text content container */}
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  {/* Name */}
                  <h3 className="text-base font-bold text-gray-800 mb-1.5 group-hover:text-[#C21875] transition-colors line-clamp-1">
                    {cat.name}
                  </h3>
                  
                  {/* Description */}
                  <p className="text-[11px] text-gray-400 leading-relaxed line-clamp-3 font-light mb-4">
                    {cat.description || 'Premium hand-aligned instruments and custom kits.'}
                  </p>
                </div>

                {/* Explore Link */}
                <div className="pt-3 border-t border-gray-100 flex justify-between items-center">
                  <span className="text-[9px] text-[#D6B36A] font-bold uppercase tracking-wider font-mono">
                    LTL Division
                  </span>
                  <Link 
                    href={`/shop?category=${cat.slug}`}
                    className="flex items-center space-x-1 text-xs font-bold text-gray-700 hover:text-[#C21875] group-hover:translate-x-1 transition-all"
                  >
                    <span>Explore</span>
                    <ChevronRight size={13} className="text-[#C21875]" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
