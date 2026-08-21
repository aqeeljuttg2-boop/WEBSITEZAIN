'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCart, Product } from '@/context/CartContext';
import { ShoppingBag, Eye, FileText, Star, Heart, Check } from 'lucide-react';
import { getProductImage } from '@/lib/imageResolver';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addToCart, addToQuote } = useCart();
  const [isAdded, setIsAdded] = useState(false);
  const [isQuoteAdded, setIsQuoteAdded] = useState(false);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    addToCart(product, 1);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1800);
  };

  const handleAddToQuote = (e: React.MouseEvent) => {
    e.preventDefault();
    addToQuote(product, product.moq || 10);
    setIsQuoteAdded(true);
    setTimeout(() => setIsQuoteAdded(false), 2000);
  };

  // Split images and resolve mock paths
  const firstImage = getProductImage(product);

  // Extract original price from description
  const descMatch = product.description?.match(/\(Original Price: Rs\. ([\d.]+)\)/);
  const originalPrice = descMatch ? parseFloat(descMatch[1]) : (product.singlePrice / 0.86);

  const hasTiers = product.pricingTiers && product.pricingTiers.length > 0;

  return (
    <div className="group relative bg-white border border-gray-200 hover:border-[#C21875]/40 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col h-full">
      
      {/* Product Image Container */}
      <div className="relative block overflow-hidden aspect-square bg-gray-50 flex items-center justify-center p-2">
        {/* Clickable Image Background Link */}
        <Link href={`/product/${product.slug}`} className="absolute inset-0 z-0 flex items-center justify-center p-4">
          <div className="relative w-full h-full">
            <Image 
              src={firstImage} 
              alt={product.name} 
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
              className="object-contain transition-all duration-500 group-hover:scale-105"
            />
          </div>
        </Link>

        {/* Absolute Badges */}
        <div className="absolute top-3 left-3 z-10 flex flex-col space-y-1">
          <span className="bg-red-600 text-white text-[9px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded shadow-sm">
            14% OFF
          </span>
          {hasTiers && (
            <span className="bg-[#D6B36A] text-gray-900 text-[8px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded shadow-sm">
              Wholesale
            </span>
          )}
        </div>

        {/* Wishlist Button */}
        <button 
          onClick={(e) => {
            e.preventDefault();
          }}
          className="absolute top-3 right-3 z-10 bg-white/90 hover:bg-[#C21875] border border-gray-200 p-2 rounded-full text-gray-400 hover:text-white transition-all shadow-sm hover:scale-110 cursor-pointer"
          title="Save to Wishlist"
        >
          <Heart size={13} />
        </button>

        {/* Quick View Hover Actions */}
        <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center space-x-2.5 z-10 pointer-events-none group-hover:pointer-events-auto">
          <Link 
            href={`/product/${product.slug}`}
            className="p-3 bg-white text-gray-800 hover:bg-[#C21875] hover:text-white rounded-full shadow-md transition-colors"
            title="View Details"
          >
            <Eye size={16} />
          </Link>
          <button 
            onClick={handleAddToQuote}
            className="p-3 bg-white text-gray-800 hover:bg-[#D6B36A] hover:text-white rounded-full shadow-md transition-colors cursor-pointer"
            title="Add to B2B Quote"
          >
            <FileText size={16} />
          </button>
        </div>

        {/* Feedback badges */}
        {isQuoteAdded && (
          <div className="absolute bottom-2 inset-x-2 bg-gray-900 text-white text-[10px] font-bold text-center py-1.5 rounded-lg shadow-lg z-20 animate-fadeIn">
            Added to Wholesale Quote!
          </div>
        )}
      </div>

      {/* Product Content Details */}
      <div className="p-4 flex-grow flex flex-col justify-between">
        <div>
          {/* Title */}
          <Link href={`/product/${product.slug}`} className="block group-hover:text-[#C21875] transition-colors">
            <h3 className="text-sm font-bold text-gray-800 line-clamp-2 leading-tight min-h-[40px]">{product.name}</h3>
          </Link>

          {/* Pricing */}
          <div className="mt-2.5 flex items-baseline space-x-2">
            <span className="text-gray-400 line-through text-xs font-medium">Rs. {originalPrice.toFixed(0)}</span>
            <span className="text-red-600 font-extrabold text-sm font-mono">Rs. {product.singlePrice.toFixed(0)}</span>
          </div>

          {/* In Stock Dot */}
          <div className="flex items-center space-x-1.5 mt-2 text-[11px] text-emerald-600 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
            <span>In stock, ready to ship</span>
          </div>
        </div>

        {/* Action Button at bottom */}
        <div className="mt-4 pt-3.5 border-t border-gray-100">
          {hasTiers ? (
            <Link 
              href={`/product/${product.slug}`}
              className="block border border-gray-800 hover:bg-gray-900 hover:text-white text-gray-800 font-bold py-2.5 px-4 text-center rounded-lg text-[10px] tracking-wider transition-all uppercase"
            >
              Choose Options
            </Link>
          ) : (
            <button 
              onClick={handleAddToCart}
              className={`w-full font-bold py-2.5 px-4 text-center rounded-lg text-[10px] tracking-wider transition-all uppercase flex items-center justify-center space-x-1 cursor-pointer ${
                isAdded 
                  ? 'bg-emerald-600 border border-emerald-600 text-white shadow-sm' 
                  : 'border border-gray-800 hover:bg-[#C21875] hover:border-[#C21875] hover:text-white text-gray-800'
              }`}
            >
              {isAdded ? (
                <>
                  <Check size={13} />
                  <span>Added to Cart!</span>
                </>
              ) : (
                <>
                  <ShoppingBag size={12} className="mr-1" />
                  <span>Add to Cart</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

    </div>
  );
}
