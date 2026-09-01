import Stripe from 'stripe';

let _stripe: Stripe | null = null;

// Export as function — called at request time, not module load time
// This prevents "Invalid API Key" errors in serverless/edge environments
export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error('STRIPE_SECRET_KEY is not set. Add it to Vercel Environment Variables.');
    }
    _stripe = new Stripe(key, {
      apiVersion: '2026-08-26.dahlia',
      typescript: true,
      maxNetworkRetries: 1,
    });
  }
  return _stripe;
}
