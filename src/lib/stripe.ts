import Stripe from 'stripe';

// Server-side Stripe instance (singleton)
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-08-26.dahlia',
  typescript: true,
});

export default stripe;
