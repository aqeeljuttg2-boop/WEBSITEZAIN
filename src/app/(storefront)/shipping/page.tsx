import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata(): Promise<Metadata> {
  const page = await db.page.findUnique({ where: { slug: 'shipping' } }).catch(() => null);
  return {
    title: page?.seoTitle || page?.title || 'Shipping & Cargo Logistics Policy | Lash Tweezers Lounge',
    description: page?.seoDescription || 'Worldwide express shipping and B2B air/sea cargo export routes from Sialkot, Pakistan to 80+ countries.',
  };
}

export default async function ShippingPolicyPage() {
  const page = await db.page.findUnique({ where: { slug: 'shipping' } }).catch(() => null);

  return (
    <div className="py-16 max-w-3xl mx-auto px-4 text-white/70 text-xs leading-relaxed space-y-6">
      <h1 className="text-3xl font-bold tracking-tight text-white mb-2">{page?.title || 'Shipping & Logistics Policy'}</h1>
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
            Lash Tweezers Lounge coordinates secure international shipping routes for both single-piece customer orders and heavy B2B cargo containers. We ship to beauty academies, lash salons, and grooming distributors across 80+ countries.
          </p>

          <h2 className="text-sm font-bold text-white uppercase tracking-wider mt-6 mb-2">1. Shipping Options & Delivery Rates</h2>
          <p>
            We offer standard shipping configurations at storefront checkout:
          </p>
          <ul className="list-disc list-inside space-y-1.5 pl-2">
            <li>**Flat Rate Express (B2C & Small Orders)**: Flat fee of Rs. 150. Dispatched via Express Courier. Delivery time: 2–5 business days.</li>
            <li>**Free Express Shipping**: Applied automatically at checkout on orders with a subtotal above Rs. 2500.</li>
            <li>**Bulk LCL/FCL Cargo (B2B Contracts)**: Shipping costs are calculated based on cargo weight and volume, routed via sea cargo (CIF terms) or air freight.</li>
          </ul>

          <h2 className="text-sm font-bold text-white uppercase tracking-wider mt-6 mb-2">2. Processing & Production Lead Times</h2>
          <p>
            Standard catalog items in stock are dispatched within **48 hours** of payment clearance. Bulk orders requiring customized laser branding or packaging boxes require **15–20 business days** for plant processing. Large OEM manufacturing contracts have custom schedules specified on the Proforma invoice.
          </p>

          <h2 className="text-sm font-bold text-white uppercase tracking-wider mt-6 mb-2">3. Import Customs & Regulatory Clearance</h2>
          <p>
            All international consignments leave our Sialkot facility with complete export documentation: Commercial Invoice, Detailed Packing List, Certificate of Origin (CoO), and quality declarations. The importer is responsible for processing local customs clearances and paying local customs tariffs or VAT.
          </p>

          <h2 className="text-sm font-bold text-white uppercase tracking-wider mt-6 mb-2">4. Consignment Tracking</h2>
          <p>
            Once a shipment is dispatched, a carrier tracking code is logged on your Customer Account order card and emailed automatically. You can track packages in real-time by entering your code on our public Order Tracking page.
          </p>
        </>
      )}

      <div className="pt-6 border-t border-white/5 text-center">
        <Link href="/tracking" className="text-[#D6B36A] hover:underline font-bold">
          Go to Shipment Order Tracking page
        </Link>
      </div>
    </div>
  );
}
