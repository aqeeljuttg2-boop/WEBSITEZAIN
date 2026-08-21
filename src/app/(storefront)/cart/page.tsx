'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/context/CartContext';
import { ShoppingBag, Trash2, ArrowRight, ArrowLeft, Ticket, ShieldCheck, Truck } from 'lucide-react';
import { getProductImage } from '@/lib/imageResolver';

export default function CartPage() {
  const { cart, updateCartQty, removeFromCart, getCartSubtotal, clearCart } = useCart();
  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [couponApplied, setCouponApplied] = useState('');
  const [couponError, setCouponError] = useState('');

  const subtotal = getCartSubtotal();

  const handleApplyCoupon = () => {
    setCouponError('');
    const code = couponCode.toUpperCase().trim();
    if (code === 'WELCOME10') {
      if (subtotal >= 1000) {
        setDiscount(subtotal * 0.1);
        setCouponApplied(code);
      } else {
        setCouponError('Minimum order value for WELCOME10 is Rs. 1,000');
      }
    } else if (code === 'BULK500') {
      if (subtotal >= 5000) {
        setDiscount(500.00);
        setCouponApplied(code);
      } else {
        setCouponError('Minimum order value for BULK500 is Rs. 5,000');
      }
    } else {
      setCouponError('Invalid coupon code. Try WELCOME10 or BULK500');
    }
  };

  const handleRemoveCoupon = () => {
    setDiscount(0);
    setCouponApplied('');
    setCouponCode('');
  };

  // Calculations
  const taxRate = 0.05; // 5% sales tax
  const tax = (subtotal - discount) * taxRate;
  const shippingThreshold = 2500;
  const shipping = subtotal > 0 && subtotal >= shippingThreshold ? 0 : (subtotal > 0 ? 150.00 : 0);
  const total = Math.max(0, subtotal - discount + tax + shipping);

  return (
    <div className="w-full bg-gray-50 min-h-[calc(100vh-200px)] py-12">
      <div className="max-w-7xl mx-auto px-4 text-gray-800">
      <div className="flex flex-col space-y-3 mb-8">
        <div className="text-xs uppercase tracking-widest font-mono text-[#C21875] flex items-center space-x-2">
          <Link href="/" className="hover:underline">Home</Link>
          <span className="text-gray-400">/</span>
          <span className="text-gray-500">Shopping Cart</span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Your Shopping Cart</h1>
      </div>

      {cart.length === 0 ? (
        <div className="text-center py-20 bg-white border border-gray-200 rounded-3xl shadow-sm space-y-6 max-w-2xl mx-auto">
          <div className="w-20 h-20 bg-pink-50 text-[#C21875] rounded-full flex items-center justify-center mx-auto">
            <ShoppingBag size={36} />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-gray-900">Your shopping cart is currently empty</h3>
            <p className="text-sm text-gray-500 max-w-sm mx-auto">
              Explore our handcrafted lash tweezers, salon barber shears, and grooming accessories.
            </p>
          </div>
          <div>
            <Link 
              href="/shop" 
              className="inline-flex items-center space-x-2 bg-[#C21875] hover:bg-[#A31260] text-white text-xs font-bold uppercase tracking-wider px-8 py-3.5 rounded-full transition-all shadow-md hover:shadow-lg"
            >
              <span>Browse Catalog</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
          
          {/* LEFT: Cart items list */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="p-5 border-b border-gray-100 bg-gray-50/70 flex justify-between items-center">
                <h3 className="font-bold text-xs uppercase tracking-wider text-gray-700">
                  Cart Products ({cart.reduce((s, i) => s + i.quantity, 0)} items)
                </h3>
                <button 
                  onClick={clearCart}
                  className="text-xs text-gray-400 hover:text-red-500 font-semibold transition-colors"
                >
                  Clear All
                </button>
              </div>
              <div className="divide-y divide-gray-100">
                {cart.map((item) => {
                  const itemSubtotal = item.unitPrice * item.quantity;
                  const itemImage = getProductImage(item.product);

                  return (
                    <div key={item.product.id} className="p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 hover:bg-gray-50/50 transition-colors">
                      
                      {/* Image & details */}
                      <div className="flex items-center space-x-4 flex-1">
                        <div className="w-20 h-20 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-center p-2 shrink-0 relative overflow-hidden">
                          <Image 
                            src={itemImage} 
                            alt={item.product.name} 
                            fill 
                            sizes="80px" 
                            className="object-contain p-1"
                          />
                        </div>
                        <div>
                          <Link href={`/product/${item.product.slug}`} className="hover:text-[#C21875] font-bold text-sm text-gray-900 line-clamp-1 transition-colors">
                            {item.product.name}
                          </Link>
                          <p className="text-xs text-[#C21875] font-mono mt-0.5 font-semibold">
                            {item.product.productCode} {item.product.material ? `• ${item.product.material}` : ''}
                          </p>
                          <p className="text-[11px] text-gray-500 mt-1">
                            Unit Price: <span className="font-bold text-gray-800">Rs. {item.unitPrice.toFixed(0)}</span>
                          </p>
                        </div>
                      </div>

                      {/* Quantity control */}
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden bg-white shadow-sm">
                          <button 
                            onClick={() => updateCartQty(item.product.id, item.quantity - 1)}
                            className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-sm transition-colors cursor-pointer"
                            aria-label="Decrease quantity"
                          >
                            -
                          </button>
                          <span className="w-10 text-center text-xs font-bold font-mono text-gray-800">{item.quantity}</span>
                          <button 
                            onClick={() => updateCartQty(item.product.id, item.quantity + 1)}
                            className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-sm transition-colors cursor-pointer"
                            aria-label="Increase quantity"
                          >
                            +
                          </button>
                        </div>

                        {/* Price Details */}
                        <div className="text-right min-w-[90px]">
                          <p className="text-sm font-black text-[#C21875] font-mono">Rs. {itemSubtotal.toFixed(0)}</p>
                        </div>

                        {/* Delete button */}
                        <button 
                          onClick={() => removeFromCart(item.product.id)}
                          className="text-gray-400 hover:text-red-500 p-2 rounded-full hover:bg-red-50 transition-colors"
                          title="Remove from Cart"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-between items-center text-xs pt-2">
              <Link href="/shop" className="flex items-center space-x-1.5 font-bold hover:underline text-[#C21875]">
                <ArrowLeft size={14} />
                <span>Continue Shopping</span>
              </Link>
              <div className="flex items-center space-x-2 text-gray-500">
                <Truck size={14} className="text-emerald-600" />
                <span>Free shipping over Rs. 2,500</span>
              </div>
            </div>
          </div>

          {/* RIGHT: Order Summary */}
          <div className="space-y-6">
            <div className="bg-white border border-gray-200 p-6 rounded-2xl space-y-6 shadow-sm">
              <h3 className="font-bold text-xs uppercase tracking-wider text-gray-800 border-b border-gray-100 pb-3">
                Order Summary
              </h3>

              {/* Coupon inputs */}
              <div className="space-y-2 text-xs">
                <label className="text-gray-600 font-medium block">Promo or Discount Code</label>
                {couponApplied ? (
                  <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl">
                    <div>
                      <span className="font-bold text-emerald-700">{couponApplied}</span>
                      <span className="text-emerald-600 text-[11px] ml-1.5">Applied (-Rs. {discount.toFixed(0)})</span>
                    </div>
                    <button 
                      onClick={handleRemoveCoupon}
                      className="text-red-500 hover:underline text-[11px] font-semibold"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      placeholder="e.g. WELCOME10"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-300 text-xs px-3 py-2.5 rounded-lg focus:outline-none focus:border-[#C21875] text-gray-800 uppercase font-mono"
                    />
                    <button
                      onClick={handleApplyCoupon}
                      className="bg-gray-900 hover:bg-black text-white px-4 py-2.5 rounded-lg font-bold text-xs transition-colors flex items-center space-x-1 shrink-0"
                    >
                      <Ticket size={13} className="text-[#D6B36A]" />
                      <span>Apply</span>
                    </button>
                  </div>
                )}
                {couponError && <p className="text-[11px] text-red-500">{couponError}</p>}
                <p className="text-[10px] text-gray-400">Use <span className="font-mono font-bold text-gray-600">WELCOME10</span> (10% off &gt; Rs. 1000)</p>
              </div>

              {/* Price list */}
              <div className="space-y-3 text-xs border-y border-gray-100 py-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Cart Subtotal</span>
                  <span className="font-mono font-bold text-gray-900">Rs. {subtotal.toFixed(0)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-semibold">
                    <span>Coupon Discount</span>
                    <span className="font-mono">-Rs. {discount.toFixed(0)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Estimated Tax (5%)</span>
                  <span className="font-mono text-gray-900">Rs. {tax.toFixed(0)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Shipping</span>
                  {shipping === 0 ? (
                    <span className="text-emerald-600 font-bold uppercase tracking-wider text-[11px] bg-emerald-50 px-2 py-0.5 rounded">
                      Free Shipping
                    </span>
                  ) : (
                    <span className="font-mono font-bold text-gray-900">Rs. {shipping.toFixed(0)}</span>
                  )}
                </div>
                {shipping > 0 && (
                  <p className="text-[10px] text-gray-400 italic text-right -mt-1">
                    Add Rs. {(shippingThreshold - subtotal).toFixed(0)} more for FREE shipping!
                  </p>
                )}
              </div>

              {/* Total price */}
              <div className="flex justify-between items-end">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-500 block">Total Amount</span>
                  <span className="text-[10px] text-gray-400">Including tax and shipping</span>
                </div>
                <span className="text-2xl font-black text-[#C21875] font-mono">Rs. {total.toFixed(0)}</span>
              </div>

              {/* Checkout CTA */}
              <div className="space-y-3 pt-2">
                <Link
                  href="/checkout"
                  className="w-full bg-[#C21875] hover:bg-[#A31260] text-white text-xs font-bold uppercase tracking-wider py-4 rounded-xl text-center transition-all flex items-center justify-center space-x-2 shadow-md hover:shadow-lg"
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight size={14} />
                </Link>

                <Link
                  href="/quote"
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold uppercase tracking-wider py-3.5 rounded-xl text-center transition-all flex items-center justify-center space-x-1.5"
                >
                  <span>Switch to Wholesale B2B Quote</span>
                </Link>
              </div>

            </div>
          </div>

        </div>
      )}
      </div>
    </div>
  );
}
