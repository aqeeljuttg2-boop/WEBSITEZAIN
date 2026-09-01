import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import stripe from '@/lib/stripe';
import db from '@/lib/db';
import { broadcastRealtimeEvent } from '@/lib/realtime';
import type Stripe from 'stripe';

// Stripe requires the raw body for signature verification — disable body parsing.
export const runtime = 'nodejs';

export async function POST(request: Request) {
  const rawBody = await request.text();
  const headersList = await headers();
  const sig = headersList.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.warn('STRIPE_WEBHOOK_SECRET not set — skipping signature verification in dev');
  }

  let event: Stripe.Event;

  try {
    if (webhookSecret && sig) {
      event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
    } else {
      // Dev fallback: parse without verification (only safe locally)
      event = JSON.parse(rawBody) as Stripe.Event;
    }
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  // ── Handle events ────────────────────────────────────────────────────────────

  try {
    switch (event.type) {

      // ── Payments ─────────────────────────────────────────────────────────────
      case 'payment_intent.succeeded': {
        const pi = event.data.object as Stripe.PaymentIntent;
        const orderId = pi.metadata?.orderId;

        if (orderId) {
          await db.order.update({
            where: { id: orderId },
            data: {
              paymentStatus: 'PAID',
              status: 'CONFIRMED',
              stripePaymentIntentId: pi.id,
              stripeCustomerId: typeof pi.customer === 'string' ? pi.customer : undefined,
            },
          });

          broadcastRealtimeEvent({
            type: 'ORDER_UPDATED',
            title: `Payment confirmed for order ${orderId}`,
            message: `Rs. ${(pi.amount / 100).toLocaleString()} received via Stripe`,
            data: { orderId, paymentIntentId: pi.id },
            source: 'system',
          });
        }
        break;
      }

      case 'payment_intent.payment_failed': {
        const pi = event.data.object as Stripe.PaymentIntent;
        const orderId = pi.metadata?.orderId;
        const failureMessage = pi.last_payment_error?.message ?? 'Payment failed';

        if (orderId) {
          await db.order.update({
            where: { id: orderId },
            data: { paymentStatus: 'UNPAID', status: 'PENDING' },
          });
        }

        console.warn(`Payment failed for order ${orderId}: ${failureMessage}`);
        break;
      }

      // ── Radar (fraud) ─────────────────────────────────────────────────────────
      // Radar blocks or reviews charges before they reach payment_intent events.
      // charge.failed fires when Radar blocks; review events handle manual review queues.
      case 'charge.failed': {
        const charge = event.data.object as Stripe.Charge;
        const outcome = charge.outcome;

        if (outcome?.type === 'blocked') {
          console.warn(
            `Radar blocked charge ${charge.id} — reason: ${outcome.reason ?? 'rule'}, ` +
            `risk: ${outcome.risk_level}, email: ${charge.billing_details?.email}`
          );
          // Optionally flag the related order
          const pi = typeof charge.payment_intent === 'string' ? charge.payment_intent : null;
          if (pi) {
            const order = await db.order.findFirst({
              where: { stripePaymentIntentId: pi },
            });
            if (order) {
              await db.order.update({
                where: { id: order.id },
                data: { paymentStatus: 'UNPAID', status: 'CANCELLED', notes: `Radar blocked: ${outcome.reason}` },
              });
            }
          }
        }
        break;
      }

      case 'radar.early_fraud_warning.created': {
        const efw = event.data.object as Stripe.Radar.EarlyFraudWarning;
        console.warn(`Radar early fraud warning: ${efw.id}, fraud type: ${efw.fraud_type}`);
        break;
      }

      // ── Invoicing ─────────────────────────────────────────────────────────────
      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        const orderId = invoice.metadata?.orderId;

        if (orderId) {
          await db.order.update({
            where: { id: orderId },
            data: {
              paymentStatus: 'PAID',
              status: 'CONFIRMED',
              stripeInvoiceId: invoice.id,
            },
          });

          broadcastRealtimeEvent({
            type: 'ORDER_UPDATED',
            title: `Invoice paid for order ${orderId}`,
            message: `Invoice ${invoice.number} marked paid`,
            data: { orderId, invoiceId: invoice.id },
            source: 'system',
          });
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const orderId = invoice.metadata?.orderId;
        console.warn(`Invoice payment failed: ${invoice.id}, order: ${orderId}`);
        break;
      }

      case 'invoice.finalized': {
        const invoice = event.data.object as Stripe.Invoice;
        const orderId = invoice.metadata?.orderId;
        if (orderId) {
          await db.order.update({
            where: { id: orderId },
            data: { stripeInvoiceId: invoice.id },
          });
        }
        break;
      }

      default:
        // Unhandled event types — safe to ignore
        break;
    }
  } catch (handlerErr: any) {
    console.error(`Error handling Stripe event ${event.type}:`, handlerErr);
    // Return 200 so Stripe doesn't retry — log for manual investigation
  }

  return NextResponse.json({ received: true });
}
