'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRealtime } from '@/context/RealtimeContext';
import { normalizeImageUrl } from '@/lib/imageResolver';

interface DynamicBanner {
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
  position?: string;
  isActive?: boolean;
}

interface HeroProps {
  initialBanners?: DynamicBanner[];
}

export default function Hero({ initialBanners = [] }: HeroProps) {
  const [banners, setBanners] = useState<DynamicBanner[]>(initialBanners);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [activeSubImageIndex1, setActiveSubImageIndex1] = useState(0);
  const [activeSubImageIndex2, setActiveSubImageIndex2] = useState(0);

  const subImages1 = [
    'WhatsApp Image 2026-08-18 at 12.28.05 AM (1).jpeg',
    'WhatsApp Image 2026-08-18 at 12.28.06 AM.jpeg',
    'WhatsApp Image 2026-08-18 at 12.28.07 AM (1).jpeg',
    'WhatsApp Image 2026-08-18 at 12.28.09 AM (1).jpeg'
  ];

  const subImages2 = [
    'WhatsApp Image 2026-08-18 at 12.28.11 AM.jpeg',
    'WhatsApp Image 2026-08-18 at 12.28.12 AM.jpeg',
    'WhatsApp Image 2026-08-18 at 12.28.13 AM.jpeg',
    'WhatsApp Image 2026-08-18 at 12.28.21 AM.jpeg'
  ];

  const loadLiveBanners = async () => {
    try {
      const res = await fetch('/api/admin/banners?position=HERO_SLIDER');
      if (res.ok) {
        const data = await res.json();
        if (data.banners && data.banners.length > 0) {
          setBanners(data.banners);
        }
      }
    } catch (e) {
      // quiet fallback
    }
  };

  useRealtime(['BANNER_UPDATED', 'HOMEPAGE_UPDATED'], () => {
    loadLiveBanners();
  });

  // Rotate slide 1 sub-images every 3.5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSubImageIndex1((prev) => (prev + 1) % subImages1.length);
    }, 3500);
    return () => clearInterval(timer);
  }, [subImages1.length]);

  // Rotate slide 2 sub-images every 3.5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSubImageIndex2((prev) => (prev + 1) % subImages2.length);
    }, 3500);
    return () => clearInterval(timer);
  }, [subImages2.length]);

  // Determine slide count
  const slideCount = banners.length > 0 ? banners.length : 2;

  // Autoplay slider logic
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slideCount);
    }, 6000);
    return () => clearInterval(timer);
  }, [slideCount]);

  // If dynamic database banners exist, render them
  if (banners.length > 0) {
    return (
      <div className="relative w-full h-[320px] sm:h-[420px] md:h-[500px] lg:h-[540px] overflow-hidden bg-[#171017]">
        {banners.map((banner, index) => (
          <div
            key={banner.id}
            className={`absolute inset-0 w-full h-full flex items-center justify-between transition-all duration-1000 ease-in-out ${
              index === currentSlide ? 'opacity-100 translate-x-0 z-10' : 'opacity-0 translate-x-full z-0'
            }`}
          >
            {/* Background Image / Color */}
            <div className="absolute inset-0 bg-gradient-to-r from-neutral-900 via-[#210614] to-black opacity-90 z-0" />
            {banner.desktopImage && (
              <div className="absolute inset-0 opacity-20 mix-blend-overlay z-0">
                <Image src={normalizeImageUrl(banner.desktopImage)} alt={banner.title} fill sizes="100vw" className="object-cover" priority={index === 0} />
              </div>
            )}

            {/* Main Slide Content Grid */}
            <div className="max-w-7xl mx-auto px-4 w-full h-full flex items-center justify-center relative z-20">
              <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10 items-center">
                
                {/* Left side texts */}
                <div className="hidden lg:block space-y-6 max-w-xl text-left text-white">
                  {banner.badge && (
                    <span className="inline-block px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full bg-[#C21875] text-white border border-[#C21875]/30 font-mono">
                      {banner.badge}
                    </span>
                  )}
                  <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight uppercase font-sans">
                    {banner.title}
                  </h1>
                  {banner.subtitle && (
                    <p className="text-sm md:text-base opacity-90 leading-relaxed font-light text-gray-300">
                      {banner.subtitle}
                    </p>
                  )}
                  
                  <div className="flex flex-wrap gap-4 pt-2">
                    {banner.buttonText && (
                      <Link 
                        href={banner.buttonUrl || '/shop'}
                        className="bg-[#C21875] hover:bg-[#A31260] text-white px-8 py-3 rounded-full text-xs font-bold uppercase tracking-widest transition-transform hover:scale-105 shadow-lg shrink-0"
                      >
                        {banner.buttonText}
                      </Link>
                    )}
                    {banner.secondaryButtonText && (
                      <Link 
                        href={banner.secondaryButtonUrl || '/catalog'}
                        className="bg-transparent border border-[#C21875] hover:bg-[#C21875]/10 text-[#C21875] px-8 py-3 rounded-full text-xs font-bold uppercase tracking-widest transition-colors shrink-0"
                      >
                        {banner.secondaryButtonText}
                      </Link>
                    )}
                  </div>
                </div>

                {/* Right Image on Desktop / Full view on mobile */}
                <div className="flex justify-center items-center w-full">
                  {banner.desktopImage ? (
                    <div className="relative w-full h-[280px] sm:h-[350px] md:h-[420px] lg:h-[480px] rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
                      <Image 
                        src={normalizeImageUrl(banner.desktopImage)} 
                        alt={banner.title} 
                        fill 
                        sizes="(max-width: 1024px) 100vw, 50vw" 
                        className="object-cover rounded-3xl hover:scale-105 transition-transform duration-700" 
                        priority={index === 0}
                      />
                    </div>
                  ) : (
                    <div className="relative w-full h-[280px] sm:h-[350px] md:h-[420px] lg:h-[480px] flex items-center justify-center">
                      <Image 
                        src="/catagori/WhatsApp Image 2026-08-18 at 12.28.05 AM (1).jpeg" 
                        alt="LTL Instruments" 
                        fill 
                        sizes="(max-width: 1024px) 100vw, 50vw" 
                        className="object-contain rounded-3xl" 
                      />
                    </div>
                  )}
                </div>

              </div>
            </div>
          </div>
        ))}

        {/* Dots Indicator */}
        {banners.length > 1 && (
          <div className="absolute bottom-3 md:bottom-6 left-0 right-0 z-30 flex justify-center space-x-3">
            {banners.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  idx === currentSlide 
                    ? 'bg-[#C21875] w-7' 
                    : 'bg-white/40 hover:bg-white/70'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  // Built-in Default Rich Slides
  const defaultSlides = [
    {
      id: 1,
      badge: 'PREMIUM BEAUTY INSTRUMENTS',
      title: 'LASH TWEEZERS & ISOLATION CLAMPS',
      subtitle: 'Handcrafted Boot Mega 75°, L-Type, and isolation tweezers made from premium Japanese Cobalt steel for volume fan excellence.',
      bgClass: 'bg-gradient-to-r from-neutral-800 via-neutral-900 to-black',
      textColorClass: 'text-white',
      badgeColorClass: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
      primaryBtnText: 'Shop Eyelash Tweezers',
      primaryBtnUrl: '/shop?category=eyelash-tweezers',
      secondaryBtnText: 'Download Catalog',
      secondaryBtnUrl: '/catalog',
      imageSVG: (
        <div className="relative w-full h-[280px] sm:h-[350px] md:h-[420px] lg:h-[480px] flex flex-col justify-center items-center overflow-hidden bg-transparent group">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(214,180,100,0.15),transparent_75%)] pointer-events-none z-0" />
          
          {subImages1.map((file, idx) => (
            <div 
              key={idx}
              className={`absolute inset-0 w-full h-full flex items-center justify-center transition-all duration-1000 ease-in-out ${
                activeSubImageIndex1 === idx 
                  ? 'opacity-100 scale-100 translate-x-0 z-10' 
                  : 'opacity-0 scale-95 translate-x-12 z-0'
              }`}
            >
              <Image 
                src={`/catagori/${file}`} 
                alt="LTL Premium Lash Tweezers" 
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-contain sm:object-cover rounded-2xl md:rounded-3xl border border-white/10 shadow-2xl hover:scale-105 transition-transform duration-700" 
                priority={idx === 0}
              />
            </div>
          ))}

          {/* Dots Indicator Overlay for Slide 1 sub-images */}
          <div className="absolute bottom-2 flex space-x-1.5 z-20">
            {subImages1.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setActiveSubImageIndex1(idx); }}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  activeSubImageIndex1 === idx ? 'bg-amber-400 w-4' : 'bg-white/30 hover:bg-white/60'
                }`}
              />
            ))}
          </div>
        </div>
      )
    },
    {
      id: 2,
      badge: 'PROFESSIONAL HAIR SHEARS',
      title: 'RAZOR EDGE BARBER SHEARS',
      subtitle: 'Handcrafted from Japan 440C Cobalt Steel. Features convex razor-edge blades, adjustable tension dial, and ergonomic paper-coated grip options.',
      bgClass: 'bg-gradient-to-r from-[#380e22] via-[#210614] to-[#171017]',
      textColorClass: 'text-white',
      badgeColorClass: 'bg-[#C21875] text-white border border-[#C21875]/30',
      primaryBtnText: 'Explore Barber Shears',
      primaryBtnUrl: '/shop?category=barber-shears',
      secondaryBtnText: 'Request B2B Quote',
      secondaryBtnUrl: '/quote',
      imageSVG: (
        <div className="relative w-full h-[280px] sm:h-[350px] md:h-[420px] lg:h-[480px] flex flex-col justify-center items-center overflow-hidden bg-transparent group">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(194,24,117,0.2),transparent_75%)] pointer-events-none z-0" />
          
          {subImages2.map((file, idx) => (
            <div 
              key={idx}
              className={`absolute inset-0 w-full h-full flex items-center justify-center transition-all duration-1000 ease-in-out ${
                activeSubImageIndex2 === idx 
                  ? 'opacity-100 scale-100 translate-x-0 z-10' 
                  : 'opacity-0 scale-95 translate-x-12 z-0'
              }`}
            >
              <Image 
                src={`/catagori/${file}`} 
                alt="LTL Premium Barber Shears" 
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-contain sm:object-cover rounded-2xl md:rounded-3xl border border-white/10 shadow-2xl hover:scale-105 transition-transform duration-700" 
                priority={idx === 0}
              />
            </div>
          ))}

          {/* Dots Indicator Overlay for Slide 2 sub-images */}
          <div className="absolute bottom-2 flex space-x-1.5 z-20">
            {subImages2.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setActiveSubImageIndex2(idx); }}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  activeSubImageIndex2 === idx ? 'bg-[#C21875] w-4' : 'bg-white/30 hover:bg-white/60'
                }`}
              />
            ))}
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="relative w-full h-[320px] sm:h-[420px] md:h-[500px] lg:h-[540px] overflow-hidden">
      
      {/* Slides Container */}
      {defaultSlides.map((slide, index) => (
        <div
          key={slide.id}
          className={`absolute inset-0 w-full h-full flex items-center justify-between transition-all duration-1000 ease-in-out ${
            index === currentSlide ? 'opacity-100 translate-x-0 z-10' : 'opacity-0 translate-x-full z-0'
          }`}
        >
          {/* Background color/gradient */}
          <div className={`absolute inset-0 ${slide.bgClass} transition-colors duration-1000`} />
          
          {/* Main Slide Content Grid */}
          <div className="max-w-7xl mx-auto px-4 w-full h-full flex items-center justify-center relative z-20">
            <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10 items-center">
              
              {/* Left side texts - DESKTOP ONLY (Hidden on mobile) */}
              <div className={`hidden lg:block space-y-6 max-w-xl text-left ${slide.textColorClass}`}>
                <span className={`inline-block px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full ${slide.badgeColorClass}`}>
                  {slide.badge}
                </span>
                <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight uppercase font-sans">
                  {slide.title}
                </h1>
                <p className="text-sm md:text-base opacity-90 leading-relaxed font-light">
                  {slide.subtitle}
                </p>
                
                <div className="flex flex-wrap gap-4 pt-2">
                  <Link 
                    href={slide.primaryBtnUrl}
                    className="bg-[#C21875] hover:bg-[#A31260] text-white px-8 py-3 rounded-full text-xs font-bold uppercase tracking-widest transition-transform hover:scale-105 shadow-lg shrink-0"
                  >
                    {slide.primaryBtnText}
                  </Link>
                  <Link 
                    href={slide.secondaryBtnUrl}
                    className="bg-transparent border border-[#C21875] hover:bg-[#C21875]/10 text-[#C21875] px-8 py-3 rounded-full text-xs font-bold uppercase tracking-widest transition-colors shrink-0"
                  >
                    {slide.secondaryBtnText}
                  </Link>
                </div>
              </div>

              {/* Product Images - FULL WIDTH ON MOBILE */}
              <div className="flex justify-center items-center w-full">
                <Link href={slide.primaryBtnUrl} className="block w-full cursor-pointer">
                  {slide.imageSVG}
                </Link>
              </div>

            </div>
          </div>
        </div>
      ))}

      {/* Dots Indicator Overlay */}
      <div className="absolute bottom-3 md:bottom-6 left-0 right-0 z-30 flex justify-center space-x-3">
        {defaultSlides.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentSlide(idx)}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              idx === currentSlide 
                ? 'bg-[#C21875] w-7' 
                : 'bg-white/40 hover:bg-white/70'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
