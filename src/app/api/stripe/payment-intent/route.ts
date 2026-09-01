import { NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';

// POST /api/stripe/payment-intent
// Creates a PaymentIntent for a given cart total and returns the client_secret.
// Radar rules run automatically on every PaymentIntent.
export async function POST(request: Request) {
  try {
    const stripe = getStripe();
    const body = await request.json();
    const {
      amount,
      currency,
      customerEmail,
      customerName,
      orderId,
    } = body;

    if (!amount || !currency) {
      return NextResponse.json(
        { error: 'amount and currency are required' },
        { status: 400 }
      );
    }

    // Find or create a Stripe Customer so Radar has a full profile to evaluate
    let customerId: string | undefined;
    if (customerEmail) {
      const existing = await stripe.customers.list({
        email: customerEmail,
        limit: 1,
      });

      if (existing.data.length > 0) {
        customerId = existing.data[0].id;
      } else {
        const customer = await stripe.customers.create({
          email: customerEmail,
          name: customerName ?? undefined,
          metadata: { source: 'lashtweezerslounge.com' },
        });
        customerId = customer.id;
      }
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount),
      currency: currency.toLowerCase(),
      customer: customerId,
      automatic_payment_methods: { enabled: true },
      receipt_email: customerEmail ?? undefined,
      metadata: {
        orderId: orderId ?? '',
        customerName: customerName ?? '',
        source: 'lashtweezerslounge.com',
      },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      customerId: customerId ?? null,
    });
  } catch (error: any) {
    console.error('PaymentIntent creation error:', error);
    return NextResponse.json(
      { error: error?.message ?? 'Failed to create payment intent' },
      { status: 500 }
    );
  }
}
