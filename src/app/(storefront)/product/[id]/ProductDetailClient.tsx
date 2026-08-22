'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCart, Product } from '@/context/CartContext';
import { 
  ShoppingBag, FileText, Phone, Star, ShieldCheck, 
  Truck, ArrowLeft, Heart, CheckCircle2, ChevronRight, Share2 
} from 'lucide-react';
import ProductCard from '@/components/ProductCard';
import { getProductImage, getAllProductImages } from '@/lib/imageResolver';

interface ProductDetailClientProps {
  product: Product & {
    pricingTiers: any[];
    reviews: any[];
    category: any;
  };
  relatedProducts: Product[];
}

export default function ProductDetailClient({ product, relatedProducts }: ProductDetailClientProps) {
  const router = useRouter();
  const { addToCart, addToQuote } = useCart();

  // Interactive states
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('description');
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isAdded, setIsAdded] = useState(false);
  const [isQuoteAdded, setIsQuoteAdded] = useState(false);

  // Review form states
  const [reviewName, setReviewName] = useState('');
  const [reviewEmail, setReviewEmail] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState('');

  // Cart & Quote actions
  const handleAddToCart = () => {
    addToCart(product, quantity);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  const handleBuyNow = () => {
    addToCart(product, quantity);
    router.push('/cart');
  };

  const handleAddToQuote = () => {
    addToQuote(product, Math.max(quantity, product.moq || 10));
    setIsQuoteAdded(true);
    setTimeout(() => setIsQuoteAdded(false), 2500);
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          name: reviewName,
          email: reviewEmail,
          rating: reviewRating,
          comment: reviewComment,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setReviewSuccess(data.message);
        setReviewName('');
        setReviewEmail('');
        setReviewComment('');
      } else {
        alert(data.error || 'Failed to submit review');
      }
    } catch (err) {
      console.error(err);
      alert('Error submitting review');
    }
  };

  // Calculate active unit price based on tiers
  let unitPrice = product.singlePrice;
  if (product.pricingTiers && product.pricingTiers.length > 0) {
    const matchingTier = product.pricingTiers.find(tier => {
      if (tier.maxQuantity === null || tier.maxQuantity === undefined) {
        return quantity >= tier.minQuantity;
      }
      return quantity >= tier.minQuantity && quantity <= tier.maxQuantity;
    });

    if (matchingTier) {
      unitPrice = matchingTier.pricePerUnit;
    }
  }
  const totalPrice = unitPrice * quantity;

  // Split images and resolve normalized paths
  const imageList = getAllProductImages(product);
  const mainImage = imageList[activeImageIndex] || imageList[0];

  // Extract original price from description
  const descMatch = product.description?.match(/\(Original Price: Rs\. ([\d.]+)\)/);
  const originalPrice = descMatch ? parseFloat(descMatch[1]) : (product.singlePrice / 0.86);

  // Clean description
  const cleanDescription = product.description?.replace(/\s*\(Original Price: Rs\..*?\)/, '') || '';

  const waText = `Hello Lash Tweezers Lounge, I am interested in placing an inquiry for:
Product: ${product.name}
SKU: ${product.sku}
Quantity: ${quantity} units
Please provide wholesale B2B pricing info.`;

  return (
    <div className="space-y-12 text-gray-800 bg-white">
      {/* Breadcrumbs */}
      <div className="flex justify-between items-center text-xs">
        <Link href="/shop" className="flex items-center space-x-2 text-gray-500 hover:text-[#C21875] transition-colors">
          <ArrowLeft size={14} />
          <span>Back to Shop</span>
        </Link>
        <div className="flex items-center space-x-2 uppercase font-mono tracking-wider text-gray-400">
          <Link href="/" className="hover:underline">Home</Link>
          <ChevronRight size={10} />
          {product.category?.parent && (
            <>
              <Link href={`/shop?category=${product.category.parent.slug}`} className="hover:underline">
                {product.category.parent.name}
              </Link>
              <ChevronRight size={10} />
            </>
          )}
          {product.category && (
            <Link href={`/shop?category=${product.category.slug}`} className="hover:underline text-gray-700 font-bold">
              {product.category.name}
            </Link>
          )}
        </div>
      </div>

      {/* Main product box */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        
        {/* LEFT: Image Gallery */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-gray-50 border border-gray-200 rounded-2xl aspect-square flex items-center justify-center p-8 overflow-hidden relative group">
            <Image 
              src={mainImage} 
              alt={product.name} 
              fill
              sizes="(max-width: 1024px) 100vw, 40vw"
              className="object-contain p-8 transform group-hover:scale-105 transition-transform duration-500"
            />
            <span className="absolute top-3 left-3 bg-red-600 text-white text-[10px] font-extrabold px-2.5 py-1 rounded shadow-sm">
              14% OFF
            </span>
          </div>

          {/* Thumbnail list */}
          {imageList.length > 1 && (
            <div className="flex space-x-3 overflow-x-auto py-1">
              {imageList.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`w-20 h-20 bg-gray-50 border rounded-xl overflow-hidden p-2 flex items-center justify-center shrink-0 transition-all relative ${
                    idx === activeImageIndex ? 'border-[#C21875] ring-1 ring-[#C21875]' : 'border-gray-200 hover:border-gray-400'
                  }`}
                >
                  <Image 
                    src={img} 
                    alt={`${product.name} thumbnail ${idx}`} 
                    fill
                    sizes="80px"
                    className="object-contain p-2" 
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* CENTER: Product Information */}
        <div className="lg:col-span-5 space-y-6">
          <div className="space-y-2 text-left">
            <div className="flex items-center space-x-2">
              <span className="text-gray-400 text-xs font-medium">by Lash Lounge</span>
              <span className="text-gray-300">•</span>
              <span className="text-gray-400 text-xs font-mono">SKU: {product.sku}</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-gray-900 leading-tight">{product.name}</h1>
            
            {/* Rating */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={14} className={i < 5 ? "fill-amber-400 stroke-amber-400" : "text-gray-200"} />
                ))}
                <span className="text-xs text-gray-500 ml-1.5">({product.reviews.length} customer reviews)</span>
              </div>
              <span className="text-gray-200">|</span>
              <span className="text-xs text-emerald-600 font-semibold flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
                <span>In stock, ready to ship</span>
              </span>
            </div>
          </div>

          {/* Pricing display */}
          <div className="bg-gray-50 border border-gray-200 p-6 rounded-2xl space-y-4 text-left">
            <div>
              <p className="text-[10px] uppercase font-bold tracking-widest text-gray-400">Online Retail Price</p>
              <div className="flex items-baseline space-x-3 mt-1">
                <span className="text-gray-400 line-through text-base">Rs.{originalPrice.toFixed(0)}</span>
                <span className="text-2xl font-black text-red-600">Rs.{product.singlePrice.toFixed(0)}</span>
                <span className="text-[10px] bg-red-100 text-red-700 font-extrabold px-2 py-0.5 rounded uppercase tracking-wider">
                  14% OFF
                </span>
              </div>
            </div>

            {/* Pricing Tiers Table */}
            {product.pricingTiers.length > 0 && (
              <div className="border-t border-gray-200 pt-4">
                <p className="text-xs uppercase font-bold tracking-wider text-gray-500 mb-2">Wholesale Bulk Rates</p>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  {product.pricingTiers.map((tier) => {
                    const isCurrentTier = quantity >= tier.minQuantity && 
                      (tier.maxQuantity === null || quantity <= tier.maxQuantity);
                    
                    return (
                      <div 
                        key={tier.id} 
                        className={`p-2.5 rounded border transition-all ${
                          isCurrentTier 
                            ? 'bg-[#FCEAF5] border-[#C21875] text-[#C21875] font-extrabold' 
                            : 'bg-white border-gray-200 text-gray-600'
                        }`}
                      >
                        <p className="font-bold">{tier.minQuantity}{tier.maxQuantity ? `-${tier.maxQuantity}` : '+'} pcs</p>
                        <p className="text-gray-900 font-extrabold mt-0.5">Rs.{tier.pricePerUnit.toFixed(0)}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Quantity Selector & Cost estimation */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-2xl text-left">
              <div className="flex items-center space-x-3 w-full sm:w-auto">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Quantity</span>
                <div className="flex items-center border border-gray-300 bg-white rounded overflow-hidden">
                  <button 
                    onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                    className="px-3.5 py-1.5 hover:bg-gray-100 text-gray-600 font-bold focus:outline-none transition-colors"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-12 text-center bg-transparent text-sm font-bold focus:outline-none border-x border-gray-200 py-1.5 text-gray-800"
                  />
                  <button 
                    onClick={() => setQuantity(prev => prev + 1)}
                    className="px-3.5 py-1.5 hover:bg-gray-100 text-gray-600 font-bold focus:outline-none transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>
              
              <div className="text-right w-full sm:w-auto">
                <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 block">Subtotal</span>
                <span className="text-sm font-bold text-gray-900">
                  {quantity} × Rs.{unitPrice.toFixed(0)} = <span className="text-[#C21875] text-base font-extrabold">Rs.{totalPrice.toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={handleAddToCart}
                className={`py-3.5 px-6 rounded-xl font-bold text-xs uppercase tracking-widest transition-all flex items-center justify-center space-x-2 cursor-pointer shadow-md ${
                  isAdded 
                    ? 'bg-emerald-600 text-white shadow-lg' 
                    : 'bg-[#C21875] hover:bg-[#A31260] text-white'
                }`}
              >
                {isAdded ? (
                  <>
                    <CheckCircle2 size={16} />
                    <span>Added to Cart!</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag size={15} />
                    <span>Add to Bag</span>
                  </>
                )}
              </button>
              <button
                onClick={handleBuyNow}
                className="py-3.5 px-6 rounded-xl font-bold text-xs uppercase tracking-widest transition-all text-center cursor-pointer bg-gray-900 hover:bg-black text-white shadow-md hover:shadow-lg"
              >
                Buy It Now
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={handleAddToQuote}
                className={`border py-3.5 px-6 rounded-xl font-bold text-xs uppercase tracking-widest transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                  isQuoteAdded
                    ? 'bg-[#D6B36A] border-[#D6B36A] text-gray-900 font-extrabold'
                    : 'bg-white border-gray-300 hover:border-[#D6B36A] hover:bg-amber-50/40 text-gray-700'
                }`}
              >
                <FileText size={15} />
                <span>{isQuoteAdded ? 'Added to Quote Cart!' : 'Add to Wholesale RFQ'}</span>
              </button>
              <a
                href={`https://wa.me/923348012580?text=${encodeURIComponent(waText)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-emerald-600 hover:bg-emerald-700 text-white py-3.5 px-6 rounded-xl font-bold text-xs uppercase tracking-widest transition-all flex items-center justify-center space-x-2 shadow-sm"
              >
                <Phone size={15} />
                <span>Chat on WhatsApp</span>
              </a>
            </div>
          </div>

          {/* Marketing Highlights */}
          <div className="grid grid-cols-3 gap-4 text-center border-t border-gray-200 pt-6 text-[10px] text-gray-500 uppercase font-mono tracking-wider">
            <div className="space-y-1">
              <ShieldCheck size={18} className="mx-auto text-[#C21875]" />
              <p className="font-bold text-gray-800">Hand-Aligned</p>
              <p className="text-[9px] text-gray-400 font-light">Premium Precision</p>
            </div>
            <div className="space-y-1">
              <Truck size={18} className="mx-auto text-[#C21875]" />
              <p className="font-bold text-gray-800">B2B Shipping</p>
              <p className="text-[9px] text-gray-400 font-light">Global Port Logistics</p>
            </div>
            <div className="space-y-1">
              <Heart size={18} className="mx-auto text-[#C21875]" />
              <p className="font-bold text-gray-800">Hygienic Steel</p>
              <p className="text-[9px] text-gray-400 font-light">Autoclave Compatible</p>
            </div>
          </div>

          {/* Social Share Button */}
          <div className="pt-2 flex justify-start">
            <button 
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                alert('Product link copied to clipboard!');
              }}
              className="flex items-center space-x-1.5 text-xs text-gray-500 hover:text-[#C21875] border border-gray-200 px-3.5 py-1.5 rounded-full transition-all cursor-pointer"
            >
              <Share2 size={12} />
              <span>Share this</span>
            </button>
          </div>
        </div>

        {/* RIGHT: You May Also Like Side Column */}
        <div className="lg:col-span-2 space-y-6">
          <h4 className="text-xs font-black uppercase tracking-widest text-gray-800 border-b border-gray-200 pb-2 text-left">
            You May Also Like
          </h4>
          <div className="flex flex-col gap-6">
            {relatedProducts.slice(0, 3).map((prod) => {
              const rFirstImage = getProductImage(prod);
              return (
                <div key={prod.id} className="flex space-x-3 text-left group">
                  <Link href={`/product/${prod.slug}`} className="w-16 h-16 bg-gray-50 border border-gray-200 rounded overflow-hidden flex items-center justify-center p-1 shrink-0 relative">
                    <Image 
                      src={rFirstImage} 
                      alt={prod.name} 
                      fill
                      sizes="64px"
                      className="object-contain p-1" 
                    />
                  </Link>
                  <div className="space-y-1">
                    <Link href={`/product/${prod.slug}`} className="text-xs font-bold text-gray-800 hover:text-[#C21875] line-clamp-2 leading-tight">
                      {prod.name}
                    </Link>
                    <div className="flex space-x-1.5 items-baseline">
                      <span className="text-[11px] font-extrabold text-[#C21875]">Rs.{prod.singlePrice.toFixed(0)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Product Tabs & Details Descriptions */}
      <div className="border-t border-gray-200 pt-10 text-left">
        <div className="flex space-x-8 border-b border-gray-200 mb-6">
          <button
            onClick={() => setActiveTab('description')}
            className={`pb-3 text-xs font-bold uppercase tracking-widest transition-colors cursor-pointer border-b-2 ${
              activeTab === 'description' ? 'border-[#C21875] text-[#C21875]' : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            Description
          </button>
          <button
            onClick={() => setActiveTab('specifications')}
            className={`pb-3 text-xs font-bold uppercase tracking-widest transition-colors cursor-pointer border-b-2 ${
              activeTab === 'specifications' ? 'border-[#C21875] text-[#C21875]' : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            Product Info
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`pb-3 text-xs font-bold uppercase tracking-widest transition-colors cursor-pointer border-b-2 ${
              activeTab === 'reviews' ? 'border-[#C21875] text-[#C21875]' : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            Reviews ({product.reviews.length})
          </button>
        </div>

        {/* Tab Content Display */}
        <div className="min-h-[150px] text-sm text-gray-600 leading-relaxed font-light">
          {activeTab === 'description' && (
            <div className="space-y-4">
              <p>{cleanDescription}</p>
              <p>Hand-aligned tips ensure absolute grip accuracy. Suitable for professional salon application and daily sterilizations.</p>
            </div>
          )}

          {activeTab === 'specifications' && (
            <div className="max-w-xl border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-200">
              <div className="grid grid-cols-2 p-3 bg-gray-50 text-xs font-bold text-gray-700">
                <span>Specification</span>
                <span>Details</span>
              </div>
              <div className="grid grid-cols-2 p-3 text-xs">
                <span className="font-medium text-gray-500">Material Formulation</span>
                <span>{product.material || 'Japanese Steel'}</span>
              </div>
              <div className="grid grid-cols-2 p-3 text-xs">
                <span className="font-medium text-gray-500">Length / Size</span>
                <span>{product.size || 'Standard Size'}</span>
              </div>
              <div className="grid grid-cols-2 p-3 text-xs">
                <span className="font-medium text-gray-500">Finish Coating</span>
                <span>{product.finish || 'Satin Coated'}</span>
              </div>
              <div className="grid grid-cols-2 p-3 text-xs">
                <span className="font-medium text-gray-500">Shipping Weight</span>
                <span>{product.weight || '20g'}</span>
              </div>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="space-y-8">
              
              {/* Write a Review Section */}
              <div className="bg-gray-50 border border-gray-200 p-6 rounded-2xl max-w-2xl">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Write a review</h3>
                
                {reviewSuccess ? (
                  <p className="text-xs text-emerald-600 font-bold bg-emerald-50 p-3 rounded">{reviewSuccess}</p>
                ) : (
                  <form onSubmit={handleReviewSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Your Name</label>
                        <input
                          type="text"
                          required
                          value={reviewName}
                          onChange={(e) => setReviewName(e.target.value)}
                          className="w-full bg-white border border-gray-300 rounded p-2 text-xs text-gray-800 focus:outline-none focus:border-gray-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Your Email</label>
                        <input
                          type="email"
                          required
                          value={reviewEmail}
                          onChange={(e) => setReviewEmail(e.target.value)}
                          className="w-full bg-white border border-gray-300 rounded p-2 text-xs text-gray-800 focus:outline-none focus:border-gray-500"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Rating</label>
                      <div className="flex space-x-1.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setReviewRating(star)}
                            className="focus:outline-none"
                          >
                            <Star 
                              size={18} 
                              className={star <= reviewRating ? "fill-amber-400 stroke-amber-400" : "text-gray-300"} 
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Review Details</label>
                      <textarea
                        required
                        rows={4}
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        className="w-full bg-white border border-gray-300 rounded p-2 text-xs text-gray-800 focus:outline-none focus:border-gray-500"
                        placeholder="Write your comments here..."
                      />
                    </div>

                    <button
                      type="submit"
                      className="bg-gray-900 hover:bg-black text-white text-xs font-bold uppercase tracking-wider px-6 py-2.5 rounded transition-all cursor-pointer"
                    >
                      Submit Review
                    </button>
                  </form>
                )}
              </div>

              {/* Reviews List */}
              <div className="space-y-6">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-2">Customer Reviews</h3>
                {product.reviews.length === 0 ? (
                  <p className="text-xs text-gray-400 font-light">No reviews posted yet. Be the first to review this product!</p>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {product.reviews.map((rev) => {
                      const initials = rev.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();
                      return (
                        <div key={rev.id} className="py-6 flex space-x-4">
                          {/* Round badge initials */}
                          <div className="w-11 h-11 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-xs font-bold text-gray-500 uppercase shrink-0">
                            {initials}
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <span className="font-bold text-xs text-gray-800">{rev.name}</span>
                              <span className="text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full flex items-center space-x-0.5 font-medium border border-emerald-100">
                                <CheckCircle2 size={10} className="text-emerald-500 fill-white" />
                                <span>Verified Buyer</span>
                              </span>
                            </div>
                            
                            {/* Stars & date */}
                            <div className="flex items-center space-x-2">
                              <div className="flex space-x-0.5">
                                {[...Array(5)].map((_, i) => (
                                  <Star key={i} size={11} className={i < rev.rating ? "fill-amber-400 stroke-amber-400" : "text-gray-200"} />
                                ))}
                              </div>
                              <span className="text-[10px] text-gray-400">{new Date(rev.createdAt).toLocaleDateString()}</span>
                            </div>
                            
                            <p className="text-xs text-gray-600 font-light mt-1.5 leading-relaxed">{rev.comment}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>
          )}
        </div>
      </div>

      {/* Bottom Related Products Section */}
      <div className="border-t border-gray-200 pt-16">
        <h3 className="text-lg font-black uppercase tracking-widest text-center text-gray-900 mb-12">
          Related Products
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {relatedProducts.slice(0, 4).map((related) => (
            <ProductCard key={related.id} product={related} />
          ))}
        </div>
      </div>
    </div>
  );
}
