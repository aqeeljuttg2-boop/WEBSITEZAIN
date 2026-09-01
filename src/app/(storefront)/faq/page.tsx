import React from 'react';
import { HelpCircle, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { Metadata } from 'next';
import db from '@/lib/db';

export const revalidate = 3600; // 1 hour ISR — page content rarely changes

export async function generateMetadata(): Promise<Metadata> {
  const page = await db.page.findUnique({ where: { slug: 'faq' } }).catch(() => null);
  return {
    title: page?.seoTitle || page?.title || 'Frequently Asked Questions (FAQ) | Lash Tweezers Lounge',
    description: page?.seoDescription || 'Answers to frequently asked questions about lash tweezers passivation, Japanese 440C steel, B2B wholesale MOQs, and laser logo branding.',
  };
}

export default async function FAQPage() {
  const page = await db.page.findUnique({ where: { slug: 'faq' } }).catch(() => null);

  const defaultFaqs = [
    {
      q: 'What stainless steel grades do you use in manufacturing?',
      a: 'We manufacture our beauty and grooming instruments using premium certified Japanese Cobalt steel, Japan 440C, and AISI 410/420 stainless steel formulations. Every raw batch is chemically audited to ensure structural carbon and cobalt limits comply with professional standards.'
    },
    {
      q: 'Are your tweezers and shears autoclave compatible?',
      a: 'Yes. All Lash Tweezers Lounge instruments are passivated in warm nitric acid baths to form a passive chromium-oxide surface barrier. They are 100% autoclavable and withstand repetitive steam sterilization cycles up to 134°C (273°F) without pitting or rust staining, provided cleaning protocols are followed.'
    },
    {
      q: 'What is the Minimum Order Quantity (MOQ) for B2B wholesale pricing?',
      a: 'The MOQ varies by instrument catalog code. Typically, lash tweezers have an MOQ of 5–10 pieces, whereas professional barber shears have an MOQ of 2 pieces. Custom OEM manufacturing requires a production MOQ of 100 pieces per pattern.'
    },
    {
      q: 'Do you offer private labeling and custom logo branding?',
      a: 'Yes. For bulk B2B and OEM buyers, we offer high-precision laser marking. We can engrave your logo, brand name, specific catalog code reference, or unique barcoding symbols directly on the steel shafts at no additional cost.'
    },
    {
      q: 'What are your payment terms for wholesale invoices?',
      a: 'For B2B wholesale orders placed via our "Request Invoice / Pay Offline" route, we issue a formal Proforma Invoice. We accept international Bank Wire transfers (T/T).'
    },
    {
      q: 'How do you handle global shipping and customs clearances?',
      a: 'We ship worldwide from our Sialkot factory. Small consignments dispatch via DHL Express, while bulk contract weights ship via air cargo or ocean freight. We provide full customs clearance dossiers, Bill of Lading (B/L), Certificate of Origin (CoO), and regulatory compliance sheets.'
    }
  ];

  return (
    <div className="py-16 max-w-4xl mx-auto px-4 text-white space-y-12">
      
      {/* Header */}
      <div className="text-center space-y-4">
        <span className="text-[#C21875] text-xs font-bold uppercase tracking-widest block font-mono">Customer Assistance</span>
        <h1 className="text-4xl font-bold tracking-tight">{page?.title || 'Frequently Asked Questions'}</h1>
        <p className="text-sm text-white/60 leading-relaxed">
          {page?.seoDescription || 'Find immediate answers to inquiries regarding beauty steel metallurgy, passivation testing, B2B wholesale contracts, and OEM logo branding.'}
        </p>
      </div>

      {/* Dynamic Content from Admin CMS if present */}
      {page?.content && page.content.trim().length > 50 && (
        <div className="bg-[#1c141c] border border-white/5 rounded-2xl p-6 text-xs text-white/80 whitespace-pre-line leading-relaxed">
          {page.content}
        </div>
      )}

      {/* Accordion Questions */}
      <div className="space-y-6">
        {defaultFaqs.map((faq, idx) => (
          <div key={idx} className="bg-[#1c141c] border border-white/5 p-6 rounded-2xl space-y-3">
            <h3 className="font-bold text-sm text-white flex items-start space-x-2">
              <HelpCircle size={16} className="text-[#C21875] shrink-0 mt-0.5" />
              <span>{faq.q}</span>
            </h3>
            <p className="text-xs text-white/50 leading-relaxed pl-6">{faq.a}</p>
          </div>
        ))}
      </div>

      {/* WhatsApp CTA */}
      <div className="bg-[#1c141c] border border-[#C21875]/30 p-8 rounded-3xl text-center space-y-4 max-w-2xl mx-auto">
        <h4 className="font-bold text-white text-base">Still Have Questions?</h4>
        <p className="text-xs text-white/60 leading-relaxed">
          Our global customer support coordinators are available on WhatsApp to answer detailed metallurgical or shipping questions.
        </p>
        <div className="pt-2 flex justify-center space-x-4">
          <a 
            href="https://wa.me/923348012580?text=Hi,%20I%20have%20questions%20about%20your%20beauty%20instruments%20passivation."
            target="_blank" rel="noopener noreferrer"
            className="bg-[#C21875] text-white px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider hover:bg-[#A31260]"
          >
            Chat on WhatsApp
          </a>
          <Link 
            href="/contact"
            className="bg-transparent border border-white/20 px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider hover:border-white"
          >
            Email Support
          </Link>
        </div>
      </div>

    </div>
  );
}
