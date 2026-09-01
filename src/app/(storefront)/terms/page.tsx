import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import db from '@/lib/db';

export const revalidate = 3600; // 1 hour ISR — page content rarely changes

export async function generateMetadata(): Promise<Metadata> {
  const page = await db.page.findUnique({ where: { slug: 'terms' } }).catch(() => null);
  return {
    title: page?.seoTitle || page?.title || 'Terms of Service | Lash Tweezers Lounge',
    description: page?.seoDescription || 'Review our terms of service, wholesale quotation validity, MOQ policies, and B2B Incoterms.',
  };
}

export default async function TermsOfServicePage() {
  const page = await db.page.findUnique({ where: { slug: 'terms' } }).catch(() => null);

  return (
    <div className="py-16 max-w-3xl mx-auto px-4 text-white/70 text-xs leading-relaxed space-y-6">
      <h1 className="text-3xl font-bold tracking-tight text-white mb-2">{page?.title || 'Terms of Service'}</h1>
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
            Welcome to Lash Tweezers Lounge. By browsing our online catalogs, creating a customer account, purchasing beauty instruments, or requesting B2B quotations, you agree to comply with and be bound by the following Terms of Service.
          </p>

          <h2 className="text-sm font-bold text-white uppercase tracking-wider mt-6 mb-2">1. Wholesale Quotations & B2B Contracts</h2>
          <p>
            All quotations generated through our RFQ Quote Cart system remain valid for **30 calendar days** from the date of issue. Prices issued on Proforma Invoices reflect FOB (Free on Board) Sialkot or CIF (Cost, Insurance, and Freight) seaport targets as specified on the contract. Wholesale orders are only scheduled for forging production once the deposit (typically 30% T/T wire) clears our bank.
          </p>

          <h2 className="text-sm font-bold text-white uppercase tracking-wider mt-6 mb-2">2. Minimum Order Quantities (MOQ)</h2>
          <p>
            Catalog product orders must meet the specified Minimum Order Quantity displayed on the product details card. The shopping cart checkout block restricts checkout completion if quantities drop below product MOQs. For custom OEM manufacturing patterns, the standard production run MOQ is 100 units.
          </p>

          <h2 className="text-sm font-bold text-white uppercase tracking-wider mt-6 mb-2">3. Shipping Liability & Customs</h2>
          <p>
            For international bulk shipments, liability transitions based on selected Incoterms. Under FOB terms, liability transitions to the buyer once the consignment passes the cargo carrier railing at the port of departure. Buyers are solely responsible for compliance with local regulations, import licenses, and local tariff duties.
          </p>

          <h2 className="text-sm font-bold text-white uppercase tracking-wider mt-6 mb-2">4. Disinfection & Sterilization Warning</h2>
          <p>
            All Lash Tweezers Lounge instruments are shipped **non-sterile**. They must be thoroughly cleaned and sterilized using standard salon disinfection/sterilization routines before professional application. Lash Tweezers Lounge is not liable for damages arising from incorrect sterilization or non-compliant cleaning.
          </p>
        </>
      )}

      <div className="pt-6 border-t border-white/5 text-center">
        <Link href="/contact" className="text-[#D6B36A] hover:underline font-bold">
          Request details on Incoterms and Bank Wire routes
        </Link>
      </div>
    </div>
  );
}
