import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata(): Promise<Metadata> {
  const page = await db.page.findUnique({ where: { slug: 'returns' } }).catch(() => null);
  return {
    title: page?.seoTitle || page?.title || 'Returns & Defect Warranty Policy | Lash Tweezers Lounge',
    description: page?.seoDescription || '1-Year manufacturing defect warranty, return authorization (RMA) procedures, and sanitary inspection terms.',
  };
}

export default async function ReturnsPolicyPage() {
  const page = await db.page.findUnique({ where: { slug: 'returns' } }).catch(() => null);

  return (
    <div className="py-16 max-w-3xl mx-auto px-4 text-white/70 text-xs leading-relaxed space-y-6">
      <h1 className="text-3xl font-bold tracking-tight text-white mb-2">{page?.title || 'Returns & Defect Policy'}</h1>
      <p className="text-[10px] uppercase font-mono tracking-wider text-white/40 mb-6">
        Last Updated: {page ? new Date(page.updatedAt).toLocaleDateString() : 'August 16, 2026'}
      </p>
      
      {page?.content && page.content.trim().length > 50 ? (
        <div className="bg-[#1c141c] border border-white/5 rounded-2xl p-6 text-xs text-white/80 whitespace-pre-line leading-relaxed">
          {page.content}
        </div>
      ) : (
        <>
          <p>
            Lash Tweezers Lounge stands by the metallurgical quality and alignment precision of our beauty and grooming instruments. Due to sanitary and hygienic regulations for professional beauty tools, returns and exchanges are strictly governed by compliance terms.
          </p>

          <h2 className="text-sm font-bold text-white uppercase tracking-wider mt-6 mb-2">1. Manufacturing Defect Warranty</h2>
          <p>
            We offer a **1-year warranty** against manufacturing defects, metallurgical cracks, and structural alignment failures. If an instrument shows signs of rust pitting, micro-fractures, or joint failure during standard salon sterilization, contact our QA office with photo evidence and the batch stamp code to receive a free replacement.
          </p>

          <h2 className="text-sm font-bold text-white uppercase tracking-wider mt-6 mb-2">2. Unopened Catalog Item Returns</h2>
          <p>
            Standard catalog products in original, unopened packaging can be returned within **14 calendar days** of delivery. Returns are subject to a **15% restocking audit fee**. The buyer is responsible for return shipping and insurance charges.
          </p>

          <h2 className="text-sm font-bold text-white uppercase tracking-wider mt-6 mb-2">3. Non-Returnable Custom Orders</h2>
          <p>
            The following orders are strictly **non-returnable and non-refundable** unless a structural metallurgical defect is verified by our engineering division:
          </p>
          <ul className="list-disc list-inside space-y-1.5 pl-2">
            <li>Custom OEM forged patterns manufactured from customer AutoCAD drawings.</li>
            <li>Instruments custom-etched with private brand names or specific catalog codes.</li>
            <li>B2B bulk orders shipped under custom packaging or custom beauty kits.</li>
          </ul>

          <h2 className="text-sm font-bold text-white uppercase tracking-wider mt-6 mb-2">4. Return Material Authorization (RMA)</h2>
          <p>
            No returns will be processed without an active RMA reference code. To request an RMA, submit your Order Number and details to our service desk. Packages received without an RMA code will be rejected at our receiving dock to comply with sanitary policies.
          </p>
        </>
      )}

      <div className="pt-6 border-t border-white/5 text-center">
        <Link href="/contact" className="text-[#D6B36A] hover:underline font-bold">
          Submit a warranty replacement claim or request RMA code
        </Link>
      </div>
    </div>
  );
}
