import React from 'react';
import Link from 'next/link';
import { FileText, Download, Eye, ExternalLink } from 'lucide-react';
import db from '@/lib/db';
import { Metadata } from 'next';

export const revalidate = 3600; // Cached, revalidated every hour

export const metadata: Metadata = {
  title: 'Download PDF Catalogues | Lash Tweezers Lounge',
  description: 'Download the official Lash Tweezers Lounge PDF catalogue and explore our comprehensive beauty and salon instrument directory.',
};

export default async function CatalogPage() {
  // Fetch root categories and subcategories safely
  let categories: any[] = [];
  try {
    categories = await db.category.findMany({
      where: { parentId: null },
      include: {
        subcategories: {
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
    });
  } catch (err) {
    console.error('CatalogPage DB Error:', err);
  }

  const pdfCatalogs = [
    {
      title: 'Lash Tweezers Lounge — Official Product Catalog',
      code: 'LTL-CAT-2026',
      size: '22.3 MB',
      pages: 'Full Catalog',
      downloadUrl: '/docs/lash-tweezers-lounge-catalog.pdf',
      fileName: 'Lash_Tweezers_Lounge_Catalog.pdf',
      iconColor: 'text-[#D6B36A]'
    }
  ];

  return (
    <div className="py-16 max-w-7xl mx-auto px-4 text-white space-y-16">
      
      {/* 1. Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <span className="text-[#C21875] text-xs font-bold uppercase tracking-widest block font-mono">Product Archives</span>
        <h1 className="text-4xl font-bold tracking-tight">PDF & Online Catalogues</h1>
        <p className="text-sm text-white/60 leading-relaxed">
          Download our complete printed catalogues or browse our extensive online reference records. Each catalog code aligns directly with searchable records on our website.
        </p>
      </div>

      {/* 2. PDF downloads grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {pdfCatalogs.map((pdf, idx) => (
          <div key={idx} className="bg-[#1c141c] border border-white/5 p-8 rounded-2xl flex flex-col justify-between hover:border-[#C21875]/35 transition-all duration-300">
            <div>
              <div className="flex justify-between items-start mb-4">
                <FileText size={40} className={pdf.iconColor} />
                <span className="text-[9px] font-mono font-bold bg-[#171017] px-2 py-0.5 rounded border border-white/5 uppercase text-white/40">
                  {pdf.code}
                </span>
              </div>
              <h3 className="font-bold text-base text-white mb-2">{pdf.title}</h3>
              <p className="text-[10px] text-white/40 font-mono">{pdf.pages} • {pdf.size}</p>
            </div>

            {/* Big download button */}
            <div className="pt-6 space-y-3">
              <a
                href={pdf.downloadUrl}
                download={pdf.fileName}
                className="w-full flex items-center justify-center space-x-2 bg-[#D6B36A] hover:bg-[#c4a05e] text-black font-bold text-xs uppercase tracking-widest py-3.5 rounded-xl transition-all"
              >
                <Download size={15} />
                <span>Download PDF Catalog</span>
              </a>
              <div className="border-t border-white/5 pt-3 flex items-center justify-between">
                <a
                  href={pdf.downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-white/40 hover:text-white flex items-center space-x-1 transition-colors"
                >
                  <Eye size={11} />
                  <span>Preview in browser</span>
                </a>
                <Link
                  href="/shop"
                  className="text-xs text-white/40 hover:text-[#C21875] flex items-center space-x-1 transition-colors"
                >
                  <span>Browse online</span>
                  <ExternalLink size={10} />
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 3. Catalog division index list */}
      <div className="bg-[#1c141c] border border-white/5 rounded-3xl p-8 md:p-12 space-y-8">
        <h2 className="text-xl font-bold tracking-tight border-b border-white/5 pb-4 text-[#D6B36A]">Online Catalogue Directory</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-xs">
          {categories.map((cat: any) => (
            <div key={cat.id} className="space-y-3">
              <div className="flex justify-between items-center bg-white/2 p-3 rounded-lg border border-white/5">
                <Link href={`/shop?category=${cat.slug}`} className="font-bold text-white hover:text-[#C21875] text-sm">
                  {cat.name}
                </Link>
                <span className="font-mono text-white/40">({cat._count?.products || 0} items)</span>
              </div>

              {cat.subcategories && cat.subcategories.length > 0 && (
                <ul className="pl-4 space-y-2 border-l border-white/10">
                  {cat.subcategories.map((sub: any) => (
                    <li key={sub.id} className="flex justify-between items-center text-white/60 hover:text-white transition-colors">
                      <Link href={`/shop?category=${sub.slug}`}>
                        {sub.name}
                      </Link>
                      <span className="font-mono text-white/30">({sub._count?.products || 0} items)</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
