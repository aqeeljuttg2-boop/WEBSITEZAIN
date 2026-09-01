import React from 'react';
import db from '@/lib/db';
import Hero from '@/components/Hero';
import CategoryGrid from '@/components/CategoryGrid';
import ProductCard from '@/components/ProductCard';
import CategoryTabs from '@/components/CategoryTabs';
import Link from 'next/link';
import Image from 'next/image';
import fs from 'fs';
import path from 'path';
import { normalizeImageUrl } from '@/lib/imageResolver';

export const revalidate = 30; // ISR — revalidate every 30 seconds

const fallbackCategoryImages = [
  'WhatsApp Image 2026-08-18 at 12.28.05 AM (1).jpeg',
  'WhatsApp Image 2026-08-18 at 12.28.05 AM.jpeg',
  'WhatsApp Image 2026-08-18 at 12.28.06 AM.jpeg',
  'WhatsApp Image 2026-08-18 at 12.28.07 AM (1).jpeg',
  'WhatsApp Image 2026-08-18 at 12.28.07 AM.jpeg',
  'WhatsApp Image 2026-08-18 at 12.28.09 AM (1).jpeg',
  'WhatsApp Image 2026-08-18 at 12.28.09 AM.jpeg',
  'WhatsApp Image 2026-08-18 at 12.28.10 AM.jpeg',
  'WhatsApp Image 2026-08-18 at 12.28.11 AM.jpeg',
  'WhatsApp Image 2026-08-18 at 12.28.12 AM (1).jpeg',
  'WhatsApp Image 2026-08-18 at 12.28.12 AM.jpeg',
  'WhatsApp Image 2026-08-18 at 12.28.13 AM.jpeg',
  'WhatsApp Image 2026-08-18 at 12.28.14 AM.jpeg',
  'WhatsApp Image 2026-08-18 at 12.28.15 AM.jpeg',
  'WhatsApp Image 2026-08-18 at 12.28.16 AM.jpeg',
  'WhatsApp Image 2026-08-18 at 12.28.17 AM (1).jpeg',
  'WhatsApp Image 2026-08-18 at 12.28.17 AM.jpeg',
  'WhatsApp Image 2026-08-18 at 12.28.18 AM.jpeg',
  'WhatsApp Image 2026-08-18 at 12.28.19 AM (1).jpeg',
  'WhatsApp Image 2026-08-18 at 12.28.19 AM.jpeg',
  'WhatsApp Image 2026-08-18 at 12.28.20 AM.jpeg',
  'WhatsApp Image 2026-08-18 at 12.28.21 AM (1).jpeg',
  'WhatsApp Image 2026-08-18 at 12.28.21 AM.jpeg',
  'WhatsApp Image 2026-08-18 at 12.28.22 AM.jpeg'
];

let cachedCategoryGalleryImages: string[] | null = null;

function getCachedCategoryImages(): string[] {
  if (cachedCategoryGalleryImages && cachedCategoryGalleryImages.length > 0) {
    return cachedCategoryGalleryImages;
  }
  try {
    const catagoriDir = path.join(process.cwd(), 'public', 'catagori');
    if (fs.existsSync(catagoriDir)) {
      const files = fs.readdirSync(catagoriDir)
        .filter(f => f.endsWith('.jpeg') || f.endsWith('.jpg') || f.endsWith('.png'));
      if (files.length > 0) {
        cachedCategoryGalleryImages = files;
        return files;
      }
    }
  } catch (err) {
    // quiet fallback
  }
  cachedCategoryGalleryImages = fallbackCategoryImages;
  return fallbackCategoryImages;
}

export default async function HomePage() {
  const categoryImages = getCachedCategoryImages();

  // Fetch categories, products, banners & homepage section configuration in parallel
  let categories: any[] = [];
  let featuredTweezers: any[] = [];
  let hairShearsProducts: any[] = [];
  let allActiveProducts: any[] = [];
  let heroBanners: any[] = [];
  let homepageSectionsMap: Record<string, any> = {};

  try {
    const [cats, feat, shears, allProds, banners, sections] = await Promise.all([
      db.category.findMany({
        where: { parentId: null, isActive: true },
        include: {
          subcategories: {
            where: { isActive: true },
            include: {
              _count: {
                select: { products: true }
              }
            }
          },
          _count: {
            select: { products: true }
          }
        },
        orderBy: { orderIndex: 'asc' }
      }),
      db.product.findMany({
        where: {
          status: 'ACTIVE',
          OR: [
            { isFeatured: true },
            { category: { slug: { contains: 'tweezer' } } },
            { category: { name: { contains: 'Tweezer' } } },
            { name: { contains: 'Tweezer' } }
          ]
        },
        select: {
          id: true, name: true, slug: true, productCode: true,
          singlePrice: true, images: true, moq: true, description: true, status: true,
          category: { select: { id: true, name: true, slug: true } },
          pricingTiers: { select: { minQuantity: true, maxQuantity: true, price: true } }
        },
        take: 10,
        orderBy: { createdAt: 'desc' }
      }),
      db.product.findMany({
        where: {
          status: 'ACTIVE',
          OR: [
            { category: { slug: { contains: 'shear' } } },
            { category: { slug: { contains: 'scissor' } } },
            { category: { name: { contains: 'Shear' } } },
            { name: { contains: 'Shear' } },
            { name: { contains: 'Scissor' } }
          ]
        },
        select: {
          id: true, name: true, slug: true, productCode: true,
          singlePrice: true, images: true, moq: true, description: true, status: true,
          category: { select: { id: true, name: true, slug: true } },
          pricingTiers: { select: { minQuantity: true, maxQuantity: true, price: true } }
        },
        take: 10,
        orderBy: { createdAt: 'desc' }
      }),
      db.product.findMany({
        where: { status: 'ACTIVE' },
        select: {
          id: true, name: true, slug: true, productCode: true,
          singlePrice: true, images: true, moq: true, description: true, status: true,
          category: { select: { id: true, name: true, slug: true } },
          pricingTiers: { select: { minQuantity: true, maxQuantity: true, price: true } }
        },
        take: 60,
        orderBy: { createdAt: 'desc' }
      }),
      db.banner.findMany({
        where: { position: 'HERO_SLIDER', isActive: true },
        orderBy: { orderIndex: 'asc' }
      }),
      db.homepageSection.findMany({
        where: { isEnabled: true },
        orderBy: { orderIndex: 'asc' }
      })
    ]);

    categories = cats;
    featuredTweezers = feat;
    hairShearsProducts = shears;
    allActiveProducts = allProds;
    heroBanners = banners;
    (sections || []).forEach(sec => {
      homepageSectionsMap[sec.sectionKey] = sec;
    });
  } catch (dbErr) {
    console.error('HomePage database query error:', dbErr);
  }

  const tweezersSection = homepageSectionsMap['trending_tweezers'];
  const shearsSection = homepageSectionsMap['shears_banner'];
  const groomingSection = homepageSectionsMap['grooming_tabs'];
  const shavingSection = homepageSectionsMap['shaving_banner'];
  const gallerySection = homepageSectionsMap['infinite_gallery'];
  const instagramSection = homepageSectionsMap['instagram'];

  return (
    <div className="bg-white text-gray-800 space-y-0">
      
      {/* 1. Hero Azadi Sale Slider (Live connected to database banners) */}
      <Hero initialBanners={heroBanners} />

      {/* 2. Shop Categories Grid */}
      <CategoryGrid categories={categories} />

      {/* 3. Trending Tweezers Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto mb-16 space-y-3">
            <span className="text-[#C21875] text-xs font-bold uppercase tracking-widest block font-mono">
              {tweezersSection?.badge || 'Trending Instruments'}
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight uppercase">
              {tweezersSection?.title || 'Precision Lash Tweezers'}
            </h2>
            <p className="text-sm text-gray-500 font-light">
              {tweezersSection?.subtitle || 'Isolate, clamp, and pick up lash fans effortlessly with our hand-aligned, medical-grade tweezers.'}
            </p>
          </div>

          {featuredTweezers.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-sm">
              Please seed products using `npx tsx prisma/seed.ts`
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">
              {featuredTweezers.map((prod) => (
                <ProductCard key={prod.id} product={prod} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 4. Barber Shears Promo Banner Section */}
      <section className="py-20 bg-[#171017] text-white">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16">
          <div className="space-y-6 text-left">
            <span className="text-[#C21875] text-xs font-bold uppercase tracking-widest block font-mono">
              {shearsSection?.badge || 'Generational Forging'}
            </span>
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-tight uppercase font-sans">
              {shearsSection?.title || 'Professional Barber Shears'}
            </h2>
            <p className="text-sm text-gray-300 font-light leading-relaxed">
              {shearsSection?.subtitle || 'Lash Tweezers Lounge designs and manufactures handcrafted razor-edge barber shears and texturizing thinning scissors. Made of premium Japan 440C Cobalt steel, our shears provide long-lasting sharpness, friction-free pivot dials, and comfortable ergonomic finger fits.'}
            </p>
            <div className="pt-4">
              <Link 
                href={shearsSection?.buttonUrl || '/shop?category=hair-styling-shears'}
                className="bg-[#C21875] hover:bg-[#A31260] text-white font-bold text-xs uppercase tracking-widest px-8 py-3.5 rounded transition-colors inline-block"
              >
                {shearsSection?.buttonText || 'Browse Shears'}
              </Link>
            </div>
          </div>

          {/* Barber Shears Mockup */}
          <div className="relative overflow-hidden bg-black/30 rounded-3xl border border-white/5 h-[320px] md:h-[400px] group w-full">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#C21875/20,transparent_70%)] z-0 animate-pulse" />
            <div className="absolute inset-0 w-full h-full z-10 animate-float">
              <Image 
                src={normalizeImageUrl(shearsSection?.imageUrl || "/catagori/WhatsApp Image 2026-08-18 at 12.28.11 AM.jpeg")} 
                alt="Japan 440C Cobalt Shears" 
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover rounded-3xl hover:scale-105 transition-transform duration-500"
              />
            </div>
          </div>
        </div>

        {/* Shears Grid */}
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">
            {hairShearsProducts.map((prod) => (
              <ProductCard key={prod.id} product={prod} />
            ))}
          </div>
        </div>
      </section>

      {/* 5. Rivaj HD "Define Your Look!" & Category Tabs */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          {/* HD Banner Block */}
          <div className="bg-gradient-to-r from-[#4A0E2E] via-[#310A1F] to-[#1F0412] text-white rounded-3xl p-12 md:p-20 text-center relative overflow-hidden mb-16 shadow-lg">
            <div className="absolute inset-0 w-full h-full opacity-15 mix-blend-overlay z-0 overflow-hidden">
              <Image 
                src={normalizeImageUrl(groomingSection?.imageUrl || "/catagori/WhatsApp Image 2026-08-18 at 12.28.09 AM.jpeg")} 
                alt="Background details" 
                fill
                sizes="100vw"
                className="object-cover animate-zoom-pulse" 
              />
            </div>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,#C21875/10,transparent_50%)] z-0" />
            <div className="relative z-10 max-w-xl mx-auto space-y-6">
              <span className="text-[#D6B36A] text-xs font-bold uppercase tracking-widest block font-mono">
                {groomingSection?.badge || 'Lash Tweezers Lounge Grooming & Manicure'}
              </span>
              <h2 className="text-4xl md:text-6xl font-serif italic tracking-wide">
                {groomingSection?.title || 'Master Your Grooming!'}
              </h2>
              <p className="text-sm text-gray-300 font-light leading-relaxed">
                {groomingSection?.subtitle || 'Experience professional-grade beauty and grooming tools. Precision cuticle nippers, surgical steel pushers, double-edge safety razors, and genuine leather holsters.'}
              </p>
            </div>
          </div>

          {/* Dynamic Category Tabs Filter */}
          <CategoryTabs categories={categories} products={allActiveProducts} />
        </div>
      </section>

      {/* 6. Shaving & Razors Section Banner */}
      <section className="py-20 bg-gray-50 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6 text-left">
            <span className="text-[#C21875] text-xs font-bold uppercase tracking-widest block font-mono">
              {shavingSection?.badge || 'Shaving & Grooming'}
            </span>
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight uppercase">
              {shavingSection?.title || 'Premium Safety Razors & Bowls'}
            </h2>
            <p className="text-sm text-gray-500 font-light leading-relaxed">
              {shavingSection?.subtitle || 'Experience the art of traditional wet shaving: solid brass safety razors, hand-finished badger hair shaving brushes, and oak-stained mango hardwood shaving bowls.'}
            </p>
            <div className="flex space-x-4 pt-2">
              <Link 
                href="/shop?category=safety-razors"
                className="bg-[#C21875] hover:bg-[#A31260] text-white font-bold text-xs uppercase tracking-widest px-8 py-3.5 rounded transition-all"
              >
                Browse Razors
              </Link>
              <Link 
                href="/shop?category=brushes-bowls"
                className="bg-[#C21875] hover:bg-[#A31260] text-white font-bold text-xs uppercase tracking-widest px-8 py-3.5 rounded transition-all"
              >
                Browse Brushes
              </Link>
            </div>
          </div>

          {/* Shaving mockup banner wrapper */}
          <div className="relative overflow-hidden bg-white rounded-3xl border border-gray-200 shadow-md h-[320px] md:h-[400px] group w-full">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(194,24,117,0.1),transparent_70%)] z-0" />
            <div className="absolute inset-0 w-full h-full z-10 animate-wobble-slow">
              <Image 
                src={normalizeImageUrl(shavingSection?.imageUrl || "/catagori/WhatsApp Image 2026-08-18 at 12.28.12 AM.jpeg")} 
                alt="Premium Grooming Accessories" 
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover rounded-3xl hover:scale-105 transition-transform duration-500"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 6.5. Dynamic Infinite Scroll Showcase */}
      {categoryImages.length > 0 && (
        <section className="py-20 bg-gray-50 border-t border-b border-gray-100 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 text-center mb-12">
            <span className="text-[#C21875] text-xs font-bold uppercase tracking-widest block font-mono">
              {gallerySection?.badge || 'Premium Gallery'}
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight uppercase mt-2">
              {gallerySection?.title || 'Catalog Visual Showcase'}
            </h2>
            <p className="text-sm text-gray-500 font-light max-w-2xl mx-auto mt-2">
              {gallerySection?.subtitle || 'Explore live catalog cards of our handcrafted lash tweezers, professional styling shears, and grooming accessories.'}
            </p>
          </div>

          <div className="space-y-8 relative">
            {/* Left Scroll Track */}
            <div className="w-full overflow-hidden relative">
              <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-gray-50 to-transparent z-10 pointer-events-none" />
              <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-gray-50 to-transparent z-10 pointer-events-none" />
              
              <div className="animate-scroll-left flex space-x-6 py-4">
                {[...categoryImages.slice(0, Math.ceil(categoryImages.length / 2)), ...categoryImages.slice(0, Math.ceil(categoryImages.length / 2))].map((img, idx) => (
                  <div 
                    key={`track1-${idx}`} 
                    className="w-64 h-80 bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-xl hover:border-[#C21875]/40 hover:-translate-y-2 transition-all duration-300 shrink-0 group flex flex-col p-3 animate-fade-in"
                  >
                    <div className="w-full h-full bg-gray-50 rounded-xl overflow-hidden relative flex items-center justify-center">
                      <Image 
                        src={`/catagori/${img}`} 
                        alt="Catalog item" 
                        fill
                        sizes="256px"
                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Scroll Track */}
            <div className="w-full overflow-hidden relative">
              <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-gray-50 to-transparent z-10 pointer-events-none" />
              <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-gray-50 to-transparent z-10 pointer-events-none" />

              <div className="animate-scroll-right flex space-x-6 py-4">
                {[...categoryImages.slice(Math.ceil(categoryImages.length / 2)), ...categoryImages.slice(Math.ceil(categoryImages.length / 2))].map((img, idx) => (
                  <div 
                    key={`track2-${idx}`} 
                    className="w-64 h-80 bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-xl hover:border-[#C21875]/40 hover:-translate-y-2 transition-all duration-300 shrink-0 group flex flex-col p-3 animate-fade-in"
                  >
                    <div className="w-full h-full bg-gray-50 rounded-xl overflow-hidden relative flex items-center justify-center">
                      <Image 
                        src={`/catagori/${img}`} 
                        alt="Catalog item" 
                        fill
                        sizes="256px"
                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 7. Instagram Highlight Circles */}
      <section className="py-20 bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="max-w-xl mx-auto mb-12 space-y-3">
            <span className="text-[#C21875] text-xs font-bold uppercase tracking-widest block font-mono">
              {instagramSection?.badge || 'Follow Our Socials'}
            </span>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight uppercase">
              {instagramSection?.title || 'Lash Tweezers Lounge @ Instagram'}
            </h2>
          </div>

          <div className="flex flex-wrap justify-center items-center gap-10 md:gap-16">
            {[
              {
                title: 'Lash Tweezers',
                gradient: 'from-pink-400 to-rose-300',
                label: 'Lash Tweezers 👁️'
              },
              {
                title: 'Barber Shears',
                gradient: 'from-amber-400 to-orange-300',
                label: 'Barber Shears ✂️'
              },
              {
                title: 'Manicure Sets',
                gradient: 'from-emerald-600 to-teal-400',
                label: 'Manicure Sets 💅'
              }
            ].map((circle, index) => (
              <a 
                key={index} 
                href="https://www.instagram.com/lash_tweezers_lounge?igsi=dGl5cWUweXp0MDdj&utm_source=qr" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="group flex flex-col items-center space-y-3"
              >
                <div className="p-1 rounded-full bg-gradient-to-tr from-yellow-500 via-red-500 to-purple-600 group-hover:scale-105 transition-all shadow-md">
                    <div className={`w-24 h-24 rounded-full bg-gradient-to-br ${circle.gradient} flex items-center justify-center text-white border-2 border-white`}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 opacity-80">
                        <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                      </svg>
                    </div>
                </div>
                <span className="text-xs font-bold text-gray-700 group-hover:text-[#C21875] transition-colors">{circle.label}</span>
              </a>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
