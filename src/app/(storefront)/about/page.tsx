import React from 'react';
import { Target, Eye, ShieldCheck, Award, Heart, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { Metadata } from 'next';
import db from '@/lib/db';

export const revalidate = 3600; // 1 hour ISR — page content rarely changes

export async function generateMetadata(): Promise<Metadata> {
  const page = await db.page.findUnique({ where: { slug: 'about' } }).catch(() => null);
  return {
    title: page?.seoTitle || page?.title || 'About Our Factory & Heritage | Lash Tweezers Lounge',
    description: page?.seoDescription || 'Learn about Lash Tweezers Lounge, our manufacturing standards in Sialkot, metallurgical steel selection, and handcrafted instrument precision.',
  };
}

export default async function AboutPage() {
  const page = await db.page.findUnique({ where: { slug: 'about' } }).catch(() => null);

  return (
    <div className="py-16 max-w-7xl mx-auto px-4 text-white space-y-16">
      
      {/* 1. Header Banner */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <span className="text-[#C21875] text-xs font-bold uppercase tracking-widest block font-mono">Corporate Profile</span>
        <h1 className="text-4xl font-bold tracking-tight">{page?.title || 'Lash Tweezers Lounge'}</h1>
        <p className="text-sm text-white/60 leading-relaxed">
          {page?.seoDescription || 'Established to bridge the gap between traditional steel forging artistry and modern precision alignment, Lash Tweezers Lounge is a premium global manufacturer of handcrafted volume lash tweezers, barber shears, and grooming instruments.'}
        </p>
      </div>

      {/* Dynamic Content if provided from Admin CMS */}
      {page?.content && page.content.trim().length > 50 && (
        <div className="bg-[#1c141c] border border-white/5 rounded-3xl p-8 md:p-12 text-sm text-white/80 leading-relaxed whitespace-pre-line font-sans space-y-4">
          {page.content}
        </div>
      )}

      {/* 2. Intro grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">Years of Metallurgical Expertise</h2>
          <p className="text-xs text-white/60 leading-relaxed">
            Headquartered in the industrial manufacturing zone of Sialkot, Pakistan, Lash Tweezers Lounge blends generational forging knowledge with professional-grade quality standards.
          </p>
          <p className="text-xs text-white/60 leading-relaxed">
            Our company caters to beauty academies, professional lash salons, barber chains, B2B distributors, and private-label cosmetic brands globally. We deliver hand-aligned, custom-engraved tools that artists trust for absolute precision.
          </p>
          <div className="pt-2 flex space-x-4">
            <Link href="/shop" className="bg-[#C21875] hover:bg-[#A31260] text-white font-bold text-xs uppercase tracking-wider px-6 py-3 rounded-full">
              Explore Products Catalog
            </Link>
            <Link href="/manufacturing" className="bg-transparent border border-white/20 hover:border-white text-white font-bold text-xs uppercase tracking-wider px-6 py-3 rounded-full">
              OEM Custom Manufacturing
            </Link>
          </div>
        </div>

        {/* Brand schematic vector */}
        <div className="bg-[#1c141c] border border-white/5 rounded-3xl p-10 flex justify-center shadow-inner">
          <svg viewBox="0 0 100 100" className="w-64 h-64 stroke-[#C21875] stroke-[0.8] fill-none">
            <circle cx="50" cy="50" r="42" strokeDasharray="3,3" />
            <path d="M50 15 L50 85 M15 50 L85 50" strokeWidth="0.2" />
            <path d="M30 45 H70 L65 70 H35 Z" strokeWidth="1" stroke="#D6B36A" />
            <rect x="42" y="30" width="16" height="15" rx="1" strokeWidth="1" />
            <text x="35" y="80" className="fill-white/30 text-[4px] font-mono tracking-widest font-bold">ESTABLISHED 2016 • SALON QUALITY</text>
          </svg>
        </div>
      </div>

      {/* 3. Mission / Vision cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-[#1c141c] border border-white/5 p-8 rounded-2xl space-y-4">
          <div className="p-3 bg-[#261c26] text-[#C21875] rounded-xl w-fit">
            <Target size={24} />
          </div>
          <h3 className="text-lg font-bold">Our Mission Statement</h3>
          <p className="text-xs text-white/50 leading-relaxed">
            To manufacture and export high-performance eyelash tweezers and grooming shears that combine surgical-grade stainless steel metallurgy with ergonomic alignment, assisting beauty professionals worldwide.
          </p>
        </div>

        <div className="bg-[#1c141c] border border-white/5 p-8 rounded-2xl space-y-4">
          <div className="p-3 bg-[#261c26] text-[#D6B36A] rounded-xl w-fit">
            <Eye size={24} />
          </div>
          <h3 className="text-lg font-bold">Our Long-term Vision</h3>
          <p className="text-xs text-white/50 leading-relaxed">
            To be recognized globally as the most reliable B2B partner for private-label beauty tools, setting standard benchmarks for alignment accuracy and private engraving options.
          </p>
        </div>
      </div>

      {/* 4. Core values */}
      <div className="space-y-8">
        <h2 className="text-xl font-bold tracking-tight border-b border-white/5 pb-4 text-[#D6B36A] text-center">Our Forging Standards</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              icon: <Award size={20} className="text-[#C21875]" />,
              title: 'Premium Steel Traceability',
              desc: 'Every batch is chemically verified using spectrometer analyzers to ensure correct carbon and cobalt alloy proportions (Japanese Cobalt steel, Japan 440C).'
            },
            {
              icon: <ShieldCheck size={20} className="text-[#D6B36A]" />,
              title: 'Corrosion Resistance',
              desc: 'All instruments undergo double-passivation treatment to prevent oxidation and ensure durability during repetitive cleaning or heat sterilization cycles.'
            },
            {
              icon: <Heart size={20} className="text-[#C21875]" />,
              title: 'Ethical Manufacture',
              desc: 'Our manufacturing plants fully comply with local labor regulations, child-labor prohibition acts, and environmental waste guidelines.'
            }
          ].map((val, idx) => (
            <div key={idx} className="bg-[#1c141c] border border-white/5 p-6 rounded-2xl space-y-3">
              <div className="flex items-center space-x-3">
                {val.icon}
                <h4 className="font-bold text-sm">{val.title}</h4>
              </div>
              <p className="text-xs text-white/50 leading-relaxed">{val.desc}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
