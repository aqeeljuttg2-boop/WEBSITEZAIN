import Stripe from 'stripe';

// Lazy singleton — avoids module-level initialization errors in serverless environments
let _stripe: Stripe | null = null;

function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error('STRIPE_SECRET_KEY environment variable is not set');
    }
    _stripe = new Stripe(key, {
      apiVersion: '2026-08-26.dahlia',
      typescript: true,
      maxNetworkRetries: 1,
    });
  }
  return _stripe;
}

export default getStripe();
