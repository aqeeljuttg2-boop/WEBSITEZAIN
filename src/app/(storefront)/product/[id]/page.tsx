import React from 'react';
import db from '@/lib/db';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import ProductDetailClient from './ProductDetailClient';
import { getProductImage } from '@/lib/imageResolver';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface ProductPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { id } = await params;
  
  const product = await db.product.findFirst({
    where: {
      OR: [
        { id },
        { slug: id },
        { productCode: id }
      ]
    },
    include: {
      category: true
    }
  });

  if (!product) {
    return {
      title: 'Product Not Found | Lash Tweezers Lounge',
      description: 'The requested beauty instrument could not be found.'
    };
  }

  const firstImg = getProductImage(product);

  return {
    title: `${product.name} (${product.productCode})`,
    description: product.description || `Handcrafted ${product.name} from Lash Tweezers Lounge. Material: ${product.material || 'Japanese Cobalt Steel'}. Wholesale pricing available.`,
    keywords: [
      product.name,
      product.productCode,
      product.sku,
      product.category?.name || 'Lash Tweezers',
      product.material || 'Stainless Steel',
      'Lash Tweezers Lounge',
      'Wholesale beauty tools'
    ],
    openGraph: {
      title: `${product.name} | Lash Tweezers Lounge`,
      description: product.description || `Handcrafted export-grade ${product.name}`,
      images: [{ url: firstImg, width: 800, height: 800, alt: product.name }],
      type: 'website'
    },
    twitter: {
      card: 'summary_large_image',
      title: product.name,
      description: product.description || `Handcrafted export-grade ${product.name}`,
      images: [firstImg]
    }
  };
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { id } = await params;

  // 1. Fetch main product with category and pricing tiers safely
  let product: any = null;
  let relatedProducts: any[] = [];

  try {
    product = await db.product.findFirst({
      where: {
        OR: [
          { id },
          { slug: id },
          { productCode: id }
        ]
      },
      include: {
        category: {
          include: {
            parent: true
          }
        },
        pricingTiers: {
          orderBy: { minQuantity: 'asc' }
        },
        reviews: {
          where: { isApproved: true },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (product) {
      // 2. Fetch related products
      relatedProducts = await db.product.findMany({
        where: {
          status: 'ACTIVE',
          categoryId: product.categoryId,
          id: { not: product.id }
        },
        take: 4,
        include: {
          pricingTiers: {
            orderBy: { minQuantity: 'asc' }
          }
        }
      });
    }
  } catch (err) {
    console.error('ProductDetailPage DB Error:', err);
  }

  if (!product) {
    notFound();
  }

  const productImg = getProductImage(product);

  const jsonLd = {
    "@context": "https://schema.org/",
    "@type": "Product",
    "name": product.name,
    "image": productImg.startsWith('http') ? productImg : `https://lashtweezerslounge.com${productImg}`,
    "description": product.description || `Precision ${product.name} handcrafted by Lash Tweezers Lounge.`,
    "sku": product.sku,
    "mpn": product.productCode,
    "brand": {
      "@type": "Brand",
      "name": "Lash Tweezers Lounge"
    },
    "offers": {
      "@type": "Offer",
      "url": `https://lashtweezerslounge.com/product/${product.slug}`,
      "priceCurrency": "PKR",
      "price": product.singlePrice,
      "priceValidUntil": "2027-12-31",
      "itemCondition": "https://schema.org/NewCondition",
      "availability": "https://schema.org/InStock",
      "seller": {
        "@type": "Organization",
        "name": "Lash Tweezers Lounge"
      }
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="w-full bg-white min-h-[calc(100vh-200px)] py-10">
        <div className="max-w-7xl mx-auto px-4">
          <ProductDetailClient 
            product={product as any} 
            relatedProducts={relatedProducts as any[]} 
          />
        </div>
      </div>
    </>
  );
}
