'use client';

import React, { useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import {
  CreditCard,
  Truck,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Lock,
} from 'lucide-react';
import { getProductImage } from '@/lib/imageResolver';

// Stripe.js is loaded once at module level (singleton)
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

// ── Types ─────────────────────────────────────────────────────────────────────

interface CustomerForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  whatsapp: string;
  company: string;
  address: string;
  city: string;
  zipCode: string;
  country: string;
  notes: string;
}

// ── Inner card-payment form (rendered inside <Elements>) ───────────────────────

function StripePaymentForm({
  clientSecret,
  orderId,
  orderNumber,
  email,
  onSuccess,
}: {
  clientSecret: string;
  orderId: string;
  orderNumber: string;
  email: string;
  onSuccess: (orderNumber: string) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [cardError, setCardError] = useState('');

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setIsProcessing(true);
    setCardError('');

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/tracking?orderNumber=${encodeURIComponent(orderNumber)}`,
        receipt_email: email,
      },
      redirect: 'if_required',
    });

    if (error) {
      setCardError(error.message ?? 'Payment failed. Please try again.');
      setIsProcessing(false);
    } else {
      // Payment succeeded without redirect (e.g. cards that don't need 3DS)
      onSuccess(orderNumber);
    }
  };

  return (
    <form onSubmit={handlePay} className="space-y-5">
      <PaymentElement
        options={{
          layout: 'tabs',
          fields: { billingDetails: { email: 'never' } },
        }}
      />

      {cardError && (
        <p className="text-red-600 text-xs bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {cardError}
        </p>
      )}

      <button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full bg-[#C21875] hover:bg-[#A31260] disabled:bg-gray-400 text-white font-bold text-xs uppercase tracking-wider py-4 rounded-xl shadow-md transition-all flex items-center justify-center space-x-2"
      >
        {isProcessing ? (
          <span>Processing Payment…</span>
        ) : (
          <>
            <Lock size={13} />
            <span>Pay &amp; Confirm Order</span>
            <ArrowRight size={13} />
          </>
        )}
      </button>

      <p className="text-center text-[11px] text-gray-400 flex items-center justify-center space-x-1">
        <ShieldCheck size={13} className="text-emerald-500" />
        <span>Secured by Stripe — your card details are never stored on our servers</span>
      </p>
    </form>
  );
}

// ── Main checkout page ────────────────────────────────────────────────────────

export default function CheckoutPage() {
  const { user } = useAuth();
  const { cart, getCartSubtotal, clearCart } = useCart();

  const [form, setForm] = useState<CustomerForm>({
    firstName: user?.name ? user.name.split(' ')[0] : '',
    lastName: user?.name ? user.name.split(' ').slice(1).join(' ') : '',
    email: user?.email || '',
    phone: user?.phone || '',
    whatsapp: user?.whatsapp || '',
    company: user?.company || '',
    address: user?.address || '',
    city: user?.city || '',
    zipCode: user?.zipCode || '',
    country: user?.country || 'Pakistan',
    notes: '',
  });

  const [paymentMethod, setPaymentMethod] = useState<'CARD' | 'OFFLINE'>('OFFLINE');

  // Stripe Elements state
  const [clientSecret, setClientSecret] = useState('');
  const [pendingOrderId, setPendingOrderId] = useState('');
  const [pendingOrderNumber, setPendingOrderNumber] = useState('');

  // Page state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successOrderNumber, setSuccessOrderNumber] = useState('');
  const [formError, setFormError] = useState('');

  // ── Computed totals ──────────────────────────────────────────────────────────
  const subtotal = getCartSubtotal();
  const taxRate = 0.05;
  const tax = subtotal * taxRate;
  const shippingThreshold = 2500;
  const shipping = subtotal >= shippingThreshold ? 0 : 150;
  const total = subtotal + tax + shipping;

  // For Stripe, amounts must be integers in the smallest currency unit.
  // PKR is a zero-decimal currency — 1 PKR = 1 unit (no paisa subdivision in Stripe).
  const stripeAmount = Math.round(total);

  const setField = useCallback(
    (key: keyof CustomerForm) =>
      (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        setForm((f) => ({ ...f, [key]: e.target.value })),
    []
  );

  // ── Step 1: Create the DB order, then (for CARD) create a PaymentIntent ──────
  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    setIsSubmitting(true);
    setFormError('');

    try {
      // 1a. Create the order in the database
      const orderRes = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: `${form.firstName} ${form.lastName}`.trim() || 'Valued Customer',
          customerEmail: form.email,
          customerPhone: form.phone,
          customerWhatsapp: form.whatsapp,
          companyName: form.company,
          shippingAddress: {
            address: form.address,
            city: form.city,
            zipCode: form.zipCode,
            country: form.country,
          },
          paymentMethod,
          items: cart.map((item) => ({
            productId: item.product.id,
            quantity: item.quantity,
          })),
          notes: form.notes,
        }),
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok) {
        setFormError(orderData.error || 'Failed to place order. Please try again.');
        return;
      }

      // 1b. OFFLINE: done — show success immediately
      if (paymentMethod === 'OFFLINE') {
        clearCart();
        setSuccessOrderNumber(orderData.orderNumber);
        return;
      }

      // 1c. CARD: create a PaymentIntent, then show Stripe Elements
      const piRes = await fetch('/api/stripe/payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: stripeAmount,
          currency: 'pkr',
          customerEmail: form.email,
          customerName: `${form.firstName} ${form.lastName}`.trim(),
          orderId: orderData.order?.id ?? '',
        }),
      });

      const piData = await piRes.json();
      if (!piRes.ok) {
        setFormError(piData.error || 'Could not initialise payment. Please try again.');
        return;
      }

      setPendingOrderId(orderData.order?.id ?? '');
      setPendingOrderNumber(orderData.orderNumber);
      setClientSecret(piData.clientSecret);
    } catch (err) {
      console.error(err);
      setFormError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Called by StripePaymentForm on success ────────────────────────────────────
  const handlePaymentSuccess = (orderNumber: string) => {
    clearCart();
    setSuccessOrderNumber(orderNumber);
    setClientSecret('');
  };

  // ── Success screen ────────────────────────────────────────────────────────────
  if (successOrderNumber) {
    return (
      <div className="py-20 max-w-2xl mx-auto px-4 text-gray-800 text-center space-y-6">
        <div className="bg-white border border-gray-200 p-10 md:p-14 rounded-3xl space-y-6 shadow-xl">
          <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 size={48} />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900">
              Order Placed Successfully!
            </h2>
            <p className="text-sm text-gray-600 leading-relaxed max-w-md mx-auto">
              Thank you for your purchase. Our dispatch team is preparing your package.
            </p>
          </div>
          <div className="py-2">
            <p className="text-xs uppercase font-bold tracking-widest text-gray-400 mb-1">
              Your Order Reference
            </p>
            <p className="text-2xl font-black font-mono text-[#C21875] bg-pink-50 py-3 px-8 rounded-xl border border-pink-200 inline-block shadow-sm">
              {successOrderNumber}
            </p>
          </div>
          <p className="text-xs text-gray-500 max-w-md mx-auto">
            A confirmation has been sent to{' '}
            <span className="font-semibold text-gray-800">{form.email}</span>.
          </p>
          <div className="pt-4 flex flex-col sm:flex-row justify-center gap-3">
            <Link
              href={`/tracking?orderNumber=${encodeURIComponent(successOrderNumber)}`}
              className="bg-[#C21875] hover:bg-[#A31260] text-white font-bold text-xs uppercase tracking-wider px-8 py-3.5 rounded-xl shadow-md transition-all"
            >
              Track Order
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

  // ── Order summary sidebar (shared between both steps) ─────────────────────────
  const OrderSummary = (
    <div className="bg-white border border-gray-200 p-6 rounded-2xl space-y-6 shadow-sm sticky top-24">
      <h3 className="font-bold text-xs uppercase tracking-wider text-gray-800 border-b border-gray-100 pb-3">
        Items in Order ({cart.length})
      </h3>

      <div className="space-y-3 max-h-60 overflow-y-auto pr-1 divide-y divide-gray-100">
        {cart.map((item) => {
          const itemImg = getProductImage(item.product);
          return (
            <div
              key={item.product.id}
              className="pt-3 first:pt-0 flex items-center justify-between text-xs"
            >
              <div className="flex items-center space-x-3 flex-1 mr-2">
                <div className="w-12 h-12 bg-gray-50 border border-gray-200 rounded-lg shrink-0 relative overflow-hidden">
                  <Image
                    src={itemImg}
                    alt={item.product.name}
                    fill
                    sizes="48px"
                    className="object-contain p-1"
                  />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-gray-900 line-clamp-1">
                    {item.product.name}
                  </p>
                  <p className="text-[10px] text-gray-400 font-mono">
                    Qty: {item.quantity} × Rs. {item.unitPrice.toFixed(0)}
                  </p>
                </div>
              </div>
              <span className="font-mono font-bold text-[#C21875] shrink-0">
                Rs. {(item.unitPrice * item.quantity).toFixed(0)}
              </span>
            </div>
          );
        })}
      </div>

      <div className="space-y-2.5 text-xs border-t border-gray-100 pt-4">
        <div className="flex justify-between">
          <span className="text-gray-600">Subtotal</span>
          <span className="font-mono font-bold text-gray-900">
            Rs. {subtotal.toFixed(0)}
          </span>
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
            <span className="font-mono font-bold text-gray-900">
              Rs. {shipping.toFixed(0)}
            </span>
          )}
        </div>
      </div>

      <div className="border-t border-gray-100 pt-4 flex justify-between items-end">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-gray-500 block">
            Total Due
          </span>
          <span className="text-[10px] text-gray-400">All taxes included</span>
        </div>
        <span className="text-2xl font-black text-[#C21875] font-mono">
          Rs. {total.toFixed(0)}
        </span>
      </div>
    </div>
  );

  // ── Step 2: Stripe Elements payment form (after order is created) ──────────────
  if (clientSecret) {
    return (
      <div className="w-full bg-gray-50 min-h-[calc(100vh-200px)] py-12">
        <div className="max-w-7xl mx-auto px-4 text-gray-800">
          <div className="mb-8 space-y-2">
            <div className="text-xs uppercase tracking-widest font-mono text-[#C21875] flex items-center space-x-2">
              <Link href="/" className="hover:underline">Home</Link>
              <span className="text-gray-400">/</span>
              <Link href="/cart" className="hover:underline">Cart</Link>
              <span className="text-gray-400">/</span>
              <span className="text-gray-500">Payment</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">
              Complete Payment
            </h1>
            <p className="text-sm text-gray-500">
              Order <span className="font-bold text-gray-800">{pendingOrderNumber}</span> is
              reserved. Complete payment to confirm.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
            <div className="lg:col-span-2">
              <div className="bg-white border border-gray-200 p-6 sm:p-8 rounded-2xl shadow-sm">
                <h3 className="font-bold text-sm uppercase tracking-wider text-gray-800 border-b border-gray-100 pb-3 mb-6">
                  Card Payment
                </h3>
                <Elements
                  stripe={stripePromise}
                  options={{
                    clientSecret,
                    appearance: {
                      theme: 'stripe',
                      variables: {
                        colorPrimary: '#C21875',
                        borderRadius: '8px',
                        fontFamily: 'inherit',
                      },
                    },
                  }}
                >
                  <StripePaymentForm
                    clientSecret={clientSecret}
                    orderId={pendingOrderId}
                    orderNumber={pendingOrderNumber}
                    email={form.email}
                    onSuccess={handlePaymentSuccess}
                  />
                </Elements>
              </div>
            </div>
            <div>{OrderSummary}</div>
          </div>
        </div>
      </div>
    );
  }

  // ── Step 1: Address + payment method selection form ───────────────────────────
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
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">
            Checkout &amp; Payment
          </h1>
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
          <form
            onSubmit={handlePlaceOrder}
            className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start"
          >
            {/* LEFT: Address + Payment method */}
            <div className="lg:col-span-2 space-y-6">

              {/* Address form */}
              <div className="bg-white border border-gray-200 p-6 sm:p-8 rounded-2xl space-y-6 shadow-sm">
                <h3 className="font-bold text-sm uppercase tracking-wider text-gray-800 border-b border-gray-100 pb-3">
                  Shipping &amp; Customer Details
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1.5">
                    <label className="text-gray-600 font-medium">First Name *</label>
                    <input
                      type="text" required
                      value={form.firstName} onChange={setField('firstName')}
                      className="w-full bg-gray-50 border border-gray-300 text-gray-800 px-3.5 py-2.5 rounded-lg focus:outline-none focus:border-[#C21875]"
                      placeholder="First Name"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-gray-600 font-medium">Last Name *</label>
                    <input
                      type="text" required
                      value={form.lastName} onChange={setField('lastName')}
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
                      value={form.email} onChange={setField('email')}
                      className="w-full bg-gray-50 border border-gray-300 text-gray-800 px-3.5 py-2.5 rounded-lg focus:outline-none focus:border-[#C21875]"
                      placeholder="name@example.com"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-gray-600 font-medium">Company / Salon Name (Optional)</label>
                    <input
                      type="text"
                      value={form.company} onChange={setField('company')}
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
                      value={form.phone} onChange={setField('phone')}
                      className="w-full bg-gray-50 border border-gray-300 text-gray-800 px-3.5 py-2.5 rounded-lg focus:outline-none focus:border-[#C21875]"
                      placeholder="+92 300 1234567"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-gray-600 font-medium">WhatsApp Number (Optional)</label>
                    <input
                      type="tel"
                      value={form.whatsapp} onChange={setField('whatsapp')}
                      className="w-full bg-gray-50 border border-gray-300 text-gray-800 px-3.5 py-2.5 rounded-lg focus:outline-none focus:border-[#C21875]"
                      placeholder="For instant tracking updates"
                    />
                  </div>
                </div>

                <div className="space-y-1.5 text-xs">
                  <label className="text-gray-600 font-medium">Delivery Address *</label>
                  <input
                    type="text" required
                    value={form.address} onChange={setField('address')}
                    className="w-full bg-gray-50 border border-gray-300 text-gray-800 px-3.5 py-2.5 rounded-lg focus:outline-none focus:border-[#C21875]"
                    placeholder="House/Street/Building, Area, Landmark"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div className="space-y-1.5">
                    <label className="text-gray-600 font-medium">City *</label>
                    <input
                      type="text" required
                      value={form.city} onChange={setField('city')}
                      className="w-full bg-gray-50 border border-gray-300 text-gray-800 px-3.5 py-2.5 rounded-lg focus:outline-none focus:border-[#C21875]"
                      placeholder="e.g. Lahore, Karachi"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-gray-600 font-medium">Postal Code</label>
                    <input
                      type="text"
                      value={form.zipCode} onChange={setField('zipCode')}
                      className="w-full bg-gray-50 border border-gray-300 text-gray-800 px-3.5 py-2.5 rounded-lg focus:outline-none focus:border-[#C21875]"
                      placeholder="Postal Code"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-gray-600 font-medium">Country *</label>
                    <input
                      type="text" required
                      value={form.country} onChange={setField('country')}
                      className="w-full bg-gray-50 border border-gray-300 text-gray-800 px-3.5 py-2.5 rounded-lg focus:outline-none focus:border-[#C21875]"
                      placeholder="Pakistan"
                    />
                  </div>
                </div>

                <div className="space-y-1.5 text-xs">
                  <label className="text-gray-600 font-medium">
                    Order Notes / Special Instructions (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={form.notes} onChange={setField('notes')}
                    className="w-full bg-gray-50 border border-gray-300 text-gray-800 px-3.5 py-2 rounded-lg focus:outline-none focus:border-[#C21875]"
                    placeholder="Special notes for delivery."
                  />
                </div>
              </div>

              {/* Payment method selector */}
              <div className="bg-white border border-gray-200 p-6 sm:p-8 rounded-2xl space-y-6 shadow-sm">
                <h3 className="font-bold text-sm uppercase tracking-wider text-gray-800 border-b border-gray-100 pb-3">
                  Select Payment Method
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label
                    className={`p-4 border rounded-xl flex items-start space-x-3 cursor-pointer transition-all ${
                      paymentMethod === 'OFFLINE'
                        ? 'border-[#C21875] bg-pink-50/50 ring-1 ring-[#C21875]'
                        : 'border-gray-200 hover:border-gray-300 bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio" name="paymentMethod" value="OFFLINE"
                      checked={paymentMethod === 'OFFLINE'}
                      onChange={() => setPaymentMethod('OFFLINE')}
                      className="mt-1 text-[#C21875] focus:ring-[#C21875]"
                    />
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <Truck size={18} className="text-[#C21875]" />
                        <span className="font-bold text-xs text-gray-900">
                          Cash on Delivery / Bank Transfer
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500">
                        Pay on arrival or via IBFT / Easypaisa / JazzCash.
                      </p>
                    </div>
                  </label>

                  <label
                    className={`p-4 border rounded-xl flex items-start space-x-3 cursor-pointer transition-all ${
                      paymentMethod === 'CARD'
                        ? 'border-[#C21875] bg-pink-50/50 ring-1 ring-[#C21875]'
                        : 'border-gray-200 hover:border-gray-300 bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio" name="paymentMethod" value="CARD"
                      checked={paymentMethod === 'CARD'}
                      onChange={() => setPaymentMethod('CARD')}
                      className="mt-1 text-[#C21875] focus:ring-[#C21875]"
                    />
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <CreditCard size={18} className="text-[#C21875]" />
                        <span className="font-bold text-xs text-gray-900">
                          Debit / Credit Card
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500">
                        Secure card checkout via Stripe — Visa, Mastercard, UnionPay.
                      </p>
                    </div>
                  </label>
                </div>

                {paymentMethod === 'CARD' && (
                  <p className="text-[11px] text-gray-500 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 flex items-start space-x-2">
                    <Lock size={12} className="text-blue-400 mt-0.5 shrink-0" />
                    <span>
                      You&apos;ll enter your card details on the next screen via Stripe&apos;s
                      secure, PCI-compliant payment form.
                    </span>
                  </p>
                )}
              </div>

              {formError && (
                <p className="text-red-600 text-xs bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                  {formError}
                </p>
              )}
            </div>

            {/* RIGHT: Order summary + submit */}
            <div className="space-y-6">
              <div className="bg-white border border-gray-200 p-6 rounded-2xl space-y-6 shadow-sm sticky top-24">
                <h3 className="font-bold text-xs uppercase tracking-wider text-gray-800 border-b border-gray-100 pb-3">
                  Items in Order ({cart.length})
                </h3>

                <div className="space-y-3 max-h-60 overflow-y-auto pr-1 divide-y divide-gray-100">
                  {cart.map((item) => {
                    const itemImg = getProductImage(item.product);
                    return (
                      <div
                        key={item.product.id}
                        className="pt-3 first:pt-0 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center space-x-3 flex-1 mr-2">
                          <div className="w-12 h-12 bg-gray-50 border border-gray-200 rounded-lg shrink-0 relative overflow-hidden">
                            <Image
                              src={itemImg}
                              alt={item.product.name}
                              fill sizes="48px"
                              className="object-contain p-1"
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-gray-900 line-clamp-1">
                              {item.product.name}
                            </p>
                            <p className="text-[10px] text-gray-400 font-mono">
                              Qty: {item.quantity} × Rs. {item.unitPrice.toFixed(0)}
                            </p>
                          </div>
                        </div>
                        <span className="font-mono font-bold text-[#C21875] shrink-0">
                          Rs. {(item.unitPrice * item.quantity).toFixed(0)}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="space-y-2.5 text-xs border-t border-gray-100 pt-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-mono font-bold text-gray-900">
                      Rs. {subtotal.toFixed(0)}
                    </span>
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
                      <span className="font-mono font-bold text-gray-900">
                        Rs. {shipping.toFixed(0)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-4 flex justify-between items-end">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-500 block">
                      Total Due
                    </span>
                    <span className="text-[10px] text-gray-400">All taxes included</span>
                  </div>
                  <span className="text-2xl font-black text-[#C21875] font-mono">
                    Rs. {total.toFixed(0)}
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-[#C21875] hover:bg-[#A31260] disabled:bg-gray-400 text-white font-bold text-xs uppercase tracking-wider py-4 rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <span>Processing…</span>
                  ) : paymentMethod === 'CARD' ? (
                    <>
                      <span>Continue to Payment</span>
                      <ArrowRight size={14} />
                    </>
                  ) : (
                    <>
                      <span>Confirm &amp; Place Order</span>
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
