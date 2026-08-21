'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { CreditCard, Truck, Landmark, ShieldCheck, CheckCircle2, ArrowRight, ArrowLeft } from 'lucide-react';
import { getProductImage } from '@/lib/imageResolver';

export default function CheckoutPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { cart, getCartSubtotal, clearCart } = useCart();

  // Address Form states
  const [firstName, setFirstName] = useState(user?.name ? user.name.split(' ')[0] : '');
  const [lastName, setLastName] = useState(user?.name ? user.name.split(' ').slice(1).join(' ') : '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [whatsapp, setWhatsapp] = useState(user?.whatsapp || '');
  const [company, setCompany] = useState(user?.company || '');
  const [address, setAddress] = useState(user?.address || '');
  const [city, setCity] = useState(user?.city || '');
  const [zipCode, setZipCode] = useState(user?.zipCode || '');
  const [country, setCountry] = useState(user?.country || 'Pakistan');
  const [notes, setNotes] = useState('');
  
  // Checkout options states
  const [paymentMethod, setPaymentMethod] = useState<'CARD' | 'OFFLINE'>('OFFLINE');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successOrderNumber, setSuccessOrderNumber] = useState('');

  // Card details mock states
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');

  const subtotal = getCartSubtotal();
  const discount = 0;
  const taxRate = 0.05;
  const tax = subtotal * taxRate;
  const shippingThreshold = 2500;
  const shipping = subtotal >= shippingThreshold ? 0 : 150.00;
  const total = subtotal + tax + shipping;

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    setIsSubmitting(true);
    try {
      const fullAddress = {
        address,
        city,
        zipCode,
        country
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: `${firstName} ${lastName}`.trim() || 'Valued Customer',
          customerEmail: email,
          customerPhone: phone,
          customerWhatsapp: whatsapp,
          companyName: company,
          shippingAddress: fullAddress,
          paymentMethod,
          items: cart.map(item => ({
            productId: item.product.id,
            quantity: item.quantity
          })),
          notes
        })
      });

      const data = await res.json();
      if (res.ok) {
        setSuccessOrderNumber(data.orderNumber);
        clearCart();
      } else {
        alert(data.error || 'Failed to place order.');
      }
    } catch (e) {
      console.error(e);
      alert('An error occurred during checkout. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (successOrderNumber) {
    return (
      <div className="py-20 max-w-2xl mx-auto px-4 text-gray-800 text-center space-y-6">
        <div className="bg-white border border-gray-200 p-10 md:p-14 rounded-3xl space-y-6 shadow-xl">
          <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 size={48} />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900">Order Placed Successfully!</h2>
            <p className="text-sm text-gray-600 leading-relaxed max-w-md mx-auto">
              Thank you for your purchase. We have received your order and our dispatch team is preparing your package.
            </p>
          </div>
          <div className="py-2">
            <p className="text-xs uppercase font-bold tracking-widest text-gray-400 mb-1">Your Order Reference</p>
            <p className="text-2xl font-black font-mono text-[#C21875] bg-pink-50 py-3 px-8 rounded-xl border border-pink-200 inline-block shadow-sm">
              {successOrderNumber}
            </p>
          </div>
          <p className="text-xs text-gray-500 max-w-md mx-auto">
            A confirmation receipt with packing slip details has been sent to <span className="font-semibold text-gray-800">{email}</span>. You can track your shipment anytime.
          </p>
          <div className="pt-4 flex flex-col sm:flex-row justify-center gap-3">
            <Link 
              href={`/tracking?orderNumber=${encodeURIComponent(successOrderNumber)}`}
              className="bg-[#C21875] hover:bg-[#A31260] text-white font-bold text-xs uppercase tracking-wider px-8 py-3.5 rounded-xl shadow-md transition-all"
            >
              Track Order Dispatch
            </Link>
            <Link 
              href="/"
              className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs uppercase tracking-wider px-8 py-3.5 rounded-xl transition-all"
            >
              Return to Store
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-gray-50 min-h-[calc(100vh-200px)] py-12">
      <div className="max-w-7xl mx-auto px-4 text-gray-800">
        <div className="flex flex-col space-y-3 mb-8">
        <div className="text-xs uppercase tracking-widest font-mono text-[#C21875] flex items-center space-x-2">
          <Link href="/" className="hover:underline">Home</Link>
          <span className="text-gray-400">/</span>
          <Link href="/cart" className="hover:underline">Cart</Link>
          <span className="text-gray-400">/</span>
          <span className="text-gray-500">Checkout</span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Checkout & Payment</h1>
      </div>

      {cart.length === 0 ? (
        <div className="text-center py-20 bg-white border border-gray-200 rounded-3xl space-y-6 max-w-lg mx-auto shadow-sm">
          <p className="text-base text-gray-500">No items found in your shopping cart.</p>
          <Link 
            href="/shop" 
            className="inline-block bg-[#C21875] text-white px-8 py-3.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-md hover:bg-[#A31260] transition-colors"
          >
            Start Shopping
          </Link>
        </div>
      ) : (
        <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
          
          {/* LEFT/CENTER: Billing/Shipping & Payment forms */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Address */}
            <div className="bg-white border border-gray-200 p-6 sm:p-8 rounded-2xl space-y-6 shadow-sm">
              <h3 className="font-bold text-sm uppercase tracking-wider text-gray-800 border-b border-gray-100 pb-3">
                Shipping & Customer Details
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1.5">
                  <label className="text-gray-600 font-medium">First Name *</label>
                  <input
                    type="text" required
                    value={firstName} onChange={(e) => setFirstName(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-300 text-gray-800 px-3.5 py-2.5 rounded-lg focus:outline-none focus:border-[#C21875]"
                    placeholder="First Name"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-gray-600 font-medium">Last Name *</label>
                  <input
                    type="text" required
                    value={lastName} onChange={(e) => setLastName(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-300 text-gray-800 px-3.5 py-2.5 rounded-lg focus:outline-none focus:border-[#C21875]"
                    placeholder="Last Name"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1.5">
                  <label className="text-gray-600 font-medium">Email Address *</label>
                  <input
                    type="email" required
                    value={email} onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-300 text-gray-800 px-3.5 py-2.5 rounded-lg focus:outline-none focus:border-[#C21875]"
                    placeholder="name@example.com"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-gray-600 font-medium">Company / Salon Name (Optional)</label>
                  <input
                    type="text"
                    value={company} onChange={(e) => setCompany(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-300 text-gray-800 px-3.5 py-2.5 rounded-lg focus:outline-none focus:border-[#C21875]"
                    placeholder="e.g. Lash Lounge Studio"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1.5">
                  <label className="text-gray-600 font-medium">Phone Number *</label>
                  <input
                    type="tel" required
                    value={phone} onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-300 text-gray-800 px-3.5 py-2.5 rounded-lg focus:outline-none focus:border-[#C21875]"
                    placeholder="+92 300 1234567"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-gray-600 font-medium">WhatsApp Number (Optional)</label>
                  <input
                    type="tel"
                    value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-300 text-gray-800 px-3.5 py-2.5 rounded-lg focus:outline-none focus:border-[#C21875]"
                    placeholder="For instant tracking updates"
                  />
                </div>
              </div>

              <div className="space-y-1.5 text-xs">
                <label className="text-gray-600 font-medium">Delivery Address *</label>
                <input
                  type="text" required
                  value={address} onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 text-gray-800 px-3.5 py-2.5 rounded-lg focus:outline-none focus:border-[#C21875]"
                  placeholder="House/Street/Building, Area, Landmark"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="space-y-1.5">
                  <label className="text-gray-600 font-medium">City *</label>
                  <input
                    type="text" required
                    value={city} onChange={(e) => setCity(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-300 text-gray-800 px-3.5 py-2.5 rounded-lg focus:outline-none focus:border-[#C21875]"
                    placeholder="e.g. Lahore, Karachi, Sialkot"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-gray-600 font-medium">Postal / ZIP Code</label>
                  <input
                    type="text"
                    value={zipCode} onChange={(e) => setZipCode(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-300 text-gray-800 px-3.5 py-2.5 rounded-lg focus:outline-none focus:border-[#C21875]"
                    placeholder="Postal Code"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-gray-600 font-medium">Country *</label>
                  <input
                    type="text" required
                    value={country} onChange={(e) => setCountry(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-300 text-gray-800 px-3.5 py-2.5 rounded-lg focus:outline-none focus:border-[#C21875]"
                    placeholder="Pakistan"
                  />
                </div>
              </div>

              <div className="space-y-1.5 text-xs">
                <label className="text-gray-600 font-medium">Order Notes / Special Delivery Instructions (Optional)</label>
                <textarea
                  rows={2}
                  value={notes} onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 text-gray-800 px-3.5 py-2 rounded-lg focus:outline-none focus:border-[#C21875]"
                  placeholder="Notes about your order, e.g. special notes for delivery."
                />
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="bg-white border border-gray-200 p-6 sm:p-8 rounded-2xl space-y-6 shadow-sm">
              <h3 className="font-bold text-sm uppercase tracking-wider text-gray-800 border-b border-gray-100 pb-3">
                Select Payment Method
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className={`p-4 border rounded-xl flex items-start space-x-3 cursor-pointer transition-all ${
                  paymentMethod === 'OFFLINE' 
                    ? 'border-[#C21875] bg-pink-50/50 ring-1 ring-[#C21875]' 
                    : 'border-gray-200 hover:border-gray-300 bg-gray-50'
                }`}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="OFFLINE"
                    checked={paymentMethod === 'OFFLINE'}
                    onChange={() => setPaymentMethod('OFFLINE')}
                    className="mt-1 text-[#C21875] focus:ring-[#C21875]"
                  />
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <Truck size={18} className="text-[#C21875]" />
                      <span className="font-bold text-xs text-gray-900">Cash on Delivery / Bank Transfer</span>
                    </div>
                    <p className="text-[11px] text-gray-500">Pay when your package arrives or via Direct Online Bank Transfer (IBFT/Easypaisa/JazzCash).</p>
                  </div>
                </label>

                <label className={`p-4 border rounded-xl flex items-start space-x-3 cursor-pointer transition-all ${
                  paymentMethod === 'CARD' 
                    ? 'border-[#C21875] bg-pink-50/50 ring-1 ring-[#C21875]' 
                    : 'border-gray-200 hover:border-gray-300 bg-gray-50'
                }`}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="CARD"
                    checked={paymentMethod === 'CARD'}
                    onChange={() => setPaymentMethod('CARD')}
                    className="mt-1 text-[#C21875] focus:ring-[#C21875]"
                  />
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <CreditCard size={18} className="text-[#C21875]" />
                      <span className="font-bold text-xs text-gray-900">Debit / Credit Card</span>
                    </div>
                    <p className="text-[11px] text-gray-500">Instant online card checkout via Visa, Mastercard, or UnionPay.</p>
                  </div>
                </label>
              </div>

              {/* Card mock inputs if CARD selected */}
              {paymentMethod === 'CARD' && (
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-4 text-xs animate-fadeIn">
                  <div className="space-y-1">
                    <label className="text-gray-600 font-medium">Card Number</label>
                    <input
                      type="text"
                      placeholder="4000 1234 5678 9010"
                      value={cardNumber} onChange={(e) => setCardNumber(e.target.value)}
                      className="w-full bg-white border border-gray-300 text-gray-800 px-3 py-2 rounded focus:outline-none focus:border-[#C21875]"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-gray-600 font-medium">Expiry MM/YY</label>
                      <input
                        type="text"
                        placeholder="MM/YY"
                        value={cardExpiry} onChange={(e) => setCardExpiry(e.target.value)}
                        className="w-full bg-white border border-gray-300 text-gray-800 px-3 py-2 rounded focus:outline-none focus:border-[#C21875]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-gray-600 font-medium">CVV / CVC</label>
                      <input
                        type="text"
                        placeholder="123"
                        value={cardCvc} onChange={(e) => setCardCvc(e.target.value)}
                        className="w-full bg-white border border-gray-300 text-gray-800 px-3 py-2 rounded focus:outline-none focus:border-[#C21875]"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* RIGHT: Order Summary in Checkout */}
          <div className="space-y-6">
            <div className="bg-white border border-gray-200 p-6 rounded-2xl space-y-6 shadow-sm sticky top-24">
              <h3 className="font-bold text-xs uppercase tracking-wider text-gray-800 border-b border-gray-100 pb-3">
                Items in Order ({cart.length})
              </h3>

              {/* Items List */}
              <div className="space-y-3 max-h-60 overflow-y-auto pr-1 divide-y divide-gray-100">
                {cart.map((item) => {
                  const itemImg = getProductImage(item.product);
                  return (
                    <div key={item.product.id} className="pt-3 first:pt-0 flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-3 flex-1 mr-2">
                        <div className="w-12 h-12 bg-gray-50 border border-gray-200 rounded-lg shrink-0 relative overflow-hidden">
                          <Image src={itemImg} alt={item.product.name} fill sizes="48px" className="object-contain p-1" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-gray-900 line-clamp-1">{item.product.name}</p>
                          <p className="text-[10px] text-gray-400 font-mono">Qty: {item.quantity} × Rs. {item.unitPrice.toFixed(0)}</p>
                        </div>
                      </div>
                      <span className="font-mono font-bold text-[#C21875] shrink-0">
                        Rs. {(item.unitPrice * item.quantity).toFixed(0)}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Price summary */}
              <div className="space-y-2.5 text-xs border-t border-gray-100 pt-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-mono font-bold text-gray-900">Rs. {subtotal.toFixed(0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Sales Tax (5%)</span>
                  <span className="font-mono text-gray-900">Rs. {tax.toFixed(0)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Shipping</span>
                  {shipping === 0 ? (
                    <span className="text-emerald-600 font-bold uppercase text-[10px] bg-emerald-50 px-2 py-0.5 rounded">
                      Free
                    </span>
                  ) : (
                    <span className="font-mono font-bold text-gray-900">Rs. {shipping.toFixed(0)}</span>
                  )}
                </div>
              </div>

              {/* Grand Total */}
              <div className="border-t border-gray-100 pt-4 flex justify-between items-end">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-500 block">Total Due</span>
                  <span className="text-[10px] text-gray-400">All taxes & duties included</span>
                </div>
                <span className="text-2xl font-black text-[#C21875] font-mono">Rs. {total.toFixed(0)}</span>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#C21875] hover:bg-[#A31260] disabled:bg-gray-400 text-white font-bold text-xs uppercase tracking-wider py-4 rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer"
              >
                {isSubmitting ? (
                  <span>Processing Order...</span>
                ) : (
                  <>
                    <span>Confirm & Place Order</span>
                    <ArrowRight size={14} />
                  </>
                )}
              </button>

              <div className="flex items-center justify-center space-x-2 text-[11px] text-gray-400 pt-1">
                <ShieldCheck size={14} className="text-emerald-600" />
                <span>100% Guaranteed Original Instruments</span>
              </div>

            </div>
          </div>

        </form>
      )}
      </div>
    </div>
  );
}
