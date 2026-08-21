import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import { 
  Building2, Globe, ShieldCheck, Scale, FileText, 
  HelpCircle, Sparkles, CheckCircle2 
} from 'lucide-react';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata(): Promise<Metadata> {
  const page = await db.page.findUnique({ where: { slug: 'wholesale' } }).catch(() => null);
  return {
    title: page?.seoTitle || page?.title || 'B2B Wholesale & Institutional Supply | Lash Tweezers Lounge',
    description: page?.seoDescription || 'Wholesale B2B lash tweezers and barber shears manufacturer with tiered institutional pricing, private label laser engraving, and worldwide export shipping.',
  };
}

export default async function WholesalePage() {
  const page = await db.page.findUnique({ where: { slug: 'wholesale' } }).catch(() => null);

  return (
    <div className="py-16 max-w-7xl mx-auto px-4 text-white space-y-16">
      
      {/* 1. Header Hero */}
      <div className="text-center max-w-3xl mx-auto space-y-6">
        <span className="text-[#C21875] text-xs font-bold uppercase tracking-widest block font-mono">B2B Institutional Supply</span>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">{page?.title || 'Wholesale & Bulk Beauty Instrument Orders'}</h1>
        <p className="text-sm text-white/60 leading-relaxed">
          {page?.seoDescription || 'Lash Tweezers Lounge is a premier global manufacturing partner for beauty academies, lash salons, cosmetics brands, barber chains, and professional distributors. We deliver premium, hand-aligned stainless steel tweezers, barber shears, and grooming kits under wholesale B2B contract terms.'}
        </p>
        <div className="pt-4 flex justify-center space-x-4">
          <Link 
            href="/quote"
            className="bg-[#C21875] hover:bg-[#A31260] text-white font-bold text-xs uppercase tracking-wider px-8 py-4 rounded-full shadow-lg"
          >
            Create Quote Request
          </Link>
          <Link 
            href="/contact"
            className="bg-transparent border border-white/20 hover:border-white text-white font-bold text-xs uppercase tracking-wider px-8 py-4 rounded-full"
          >
            Contact B2B Sales
          </Link>
        </div>
      </div>

      {/* Dynamic Content from Admin CMS if present */}
      {page?.content && page.content.trim().length > 50 && (
        <div className="bg-[#1c141c] border border-white/5 rounded-3xl p-8 md:p-12 text-xs text-white/80 whitespace-pre-line leading-relaxed">
          {page.content}
        </div>
      )}

      {/* 2. Visual wholesale capabilities grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          {
            icon: <Building2 size={24} className="text-[#D6B36A]" />,
            title: 'Institutional Pricing Tiers',
            desc: 'Custom wholesale pricing configurations starting from 50+ units per item code. Transparent quantity breaks up to 10,000+ pieces.'
          },
          {
            icon: <ShieldCheck size={24} className="text-[#C21875]" />,
            title: 'OEM Brand Customization',
            desc: 'Engrave your brand name or catalog code directly on the instruments using professional laser marking. Custom autoclave box design.'
          },
          {
            icon: <Globe size={24} className="text-[#D6B36A]" />,
            title: 'Global Export Logistics',
            desc: 'FOB, CIF, and DDP shipping configurations. Complete customs dossiers, bills of lading, Certificate of Origin, and packing slips.'
          }
        ].map((item, idx) => (
          <div key={idx} className="bg-[#1c141c] border border-white/5 p-8 rounded-2xl space-y-4">
            <div className="p-3 bg-[#261c26] rounded-xl w-fit">{item.icon}</div>
            <h3 className="text-base font-bold text-white">{item.title}</h3>
            <p className="text-xs text-white/50 leading-relaxed">{item.desc}</p>
          </div>
        ))}
      </div>

      {/* 3. Detailed wholesale process */}
      <div className="bg-[#1c141c] border border-white/5 rounded-3xl p-8 md:p-12 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
        <div className="space-y-6">
          <span className="text-[#C21875] font-mono text-xs uppercase tracking-wider block">Contract Manufacturing</span>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Standard Wholesale Operations</h2>
          <p className="text-xs text-white/60 leading-relaxed">
            We operate standard manufacturing contracts for regional cosmetics distributors and international beauty brands. Our production capacity handles thousands of tweezers and shears per week.
          </p>
          
          <div className="space-y-3.5 text-xs text-white/80">
            <div className="flex items-start space-x-2">
              <CheckCircle2 size={16} className="text-[#D6B36A] shrink-0 mt-0.5" />
              <span>**Minimum Contract Order**: Starting from $1,000 USD per shipping consignment.</span>
            </div>
            <div className="flex items-start space-x-2">
              <CheckCircle2 size={16} className="text-[#D6B36A] shrink-0 mt-0.5" />
              <span>**Payment Arrangements**: Proforma Invoice wire transfers (T/T), Letter of Credit (L/C) for institutional contracts.</span>
            </div>
            <div className="flex items-start space-x-2">
              <CheckCircle2 size={16} className="text-[#D6B36A] shrink-0 mt-0.5" />
              <span>**Production Lead Times**: 3–6 weeks depending on product code complexity and quantities.</span>
            </div>
            <div className="flex items-start space-x-2">
              <CheckCircle2 size={16} className="text-[#D6B36A] shrink-0 mt-0.5" />
              <span>**Sterilization Packing**: Single blister packing or custom pouch shipments based on brand requirements.</span>
            </div>
          </div>
        </div>

        {/* B2B Blueprint visualization */}
        <div className="bg-[#171017] rounded-2xl p-8 border border-white/5 flex justify-center shadow-inner">
          <svg viewBox="0 0 100 100" className="w-56 h-56 stroke-[#D6B36A]/30 stroke-[0.8] fill-none">
            <circle cx="50" cy="50" r="45" strokeDasharray="3,3" />
            <path d="M50 5 L50 95 M5 50 L95 50" strokeWidth="0.2" />
            <rect x="25" y="25" width="50" height="50" rx="4" stroke="#C21875" />
            <text x="32" y="52" className="fill-white text-[5px] font-mono font-bold tracking-widest">B2B EXPORT</text>
            <text x="37" y="58" className="fill-[#D6B36A] text-[3px] font-mono">ISO 9001:2015</text>
          </svg>
        </div>
      </div>

    </div>
  );
}
