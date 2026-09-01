import { NextResponse } from 'next/server';

// GET /api/stripe/health
// Checks if Stripe env vars are present — never logs actual key values
export async function GET() {
  const hasSecret = !!process.env.STRIPE_SECRET_KEY;
  const hasPublishable = !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  const secretPrefix = process.env.STRIPE_SECRET_KEY?.slice(0, 12) ?? 'NOT SET';

  return NextResponse.json({
    hasSecret,
    hasPublishable,
    secretPrefix, // shows first 12 chars only e.g. "sk_test_51UA"
    node: process.version,
    env: process.env.NODE_ENV,
  });
}
