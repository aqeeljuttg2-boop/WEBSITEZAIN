import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import db from '@/lib/db';

export const revalidate = 3600; // 1 hour ISR — page content rarely changes

export async function generateMetadata(): Promise<Metadata> {
  const page = await db.page.findUnique({ where: { slug: 'privacy' } }).catch(() => null);
  return {
    title: page?.seoTitle || page?.title || 'Privacy Policy | Lash Tweezers Lounge',
    description: page?.seoDescription || 'Learn about our data security protocols, profile protection, and confidential manufacturing standards.',
  };
}

export default async function PrivacyPolicyPage() {
  const page = await db.page.findUnique({ where: { slug: 'privacy' } }).catch(() => null);

  return (
    <div className="py-16 max-w-3xl mx-auto px-4 text-white/70 text-xs leading-relaxed space-y-6">
      <h1 className="text-3xl font-bold tracking-tight text-white mb-2">{page?.title || 'Privacy Policy'}</h1>
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
            At Lash Tweezers Lounge, we prioritize the privacy and security of our customers and corporate B2B clients. This Privacy Policy documents the types of information we collect, how we use it, and the security protocols we employ to protect your data.
          </p>

          <h2 className="text-sm font-bold text-white uppercase tracking-wider mt-6 mb-2">1. Information We Collect</h2>
          <p>
            When you create an account, check out online, or submit a wholesale RFQ quotation request, we collect specific identifiers:
          </p>
          <ul className="list-disc list-inside space-y-1.5 pl-2">
            <li>**Account Profile Details**: Name, email address, phone, WhatsApp number, and country.</li>
            <li>**Corporate Information**: Company name, registration details, and tax identifiers.</li>
            <li>**Shipping Logistics**: Default shipping street addresses, city, and zip code.</li>
            <li>**Payment Transaction References**: Hashed tokens for credit card payments or offline invoice routing logs.</li>
          </ul>

          <h2 className="text-sm font-bold text-white uppercase tracking-wider mt-6 mb-2">2. How We Use Your Information</h2>
          <p>
            We utilize collected information to support our manufacturing contracts and storefront deliveries:
          </p>
          <ul className="list-disc list-inside space-y-1.5 pl-2">
            <li>Processing checkout transactions and dispatching logistics codes.</li>
            <li>Formulating custom B2B wholesale quotation proformas based on country shipping zones.</li>
            <li>Contacting procurement managers via WhatsApp regarding AutoCAD drawing specs.</li>
            <li>Routing newsletter notifications regarding new catalog PDF releases.</li>
          </ul>

          <h2 className="text-sm font-bold text-white uppercase tracking-wider mt-6 mb-2">3. Data Integrity & Security</h2>
          <p>
            We store all profile details in a secure database protected by standard authorization gates. Password hashes use cryptographic bcrypt salts. Credit card details process through SSL-encrypted simulated gateways and are never stored directly on our servers.
          </p>

          <h2 className="text-sm font-bold text-white uppercase tracking-wider mt-6 mb-2">4. Third-Party Sharing</h2>
          <p>
            Lash Tweezers Lounge does not sell customer profile records. We only share delivery addresses and contact phone numbers with designated cargo carriers (DHL Express, FedEx, air freight operators) to facilitate customs clearance and final logistics handovers.
          </p>
        </>
      )}

      <div className="pt-6 border-t border-white/5 text-center">
        <Link href="/contact" className="text-[#D6B36A] hover:underline font-bold">
          Contact our Compliance Officer regarding data rights
        </Link>
      </div>
    </div>
  );
}
