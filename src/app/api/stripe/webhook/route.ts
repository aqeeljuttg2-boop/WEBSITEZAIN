import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getStripe } from '@/lib/stripe';
import db from '@/lib/db';
import { broadcastRealtimeEvent } from '@/lib/realtime';
import type Stripe from 'stripe';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const stripe = getStripe();
  const rawBody = await request.text();
  const headersList = await headers();
  const sig = headersList.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.warn('STRIPE_WEBHOOK_SECRET not set — skipping signature verification');
  }

  let event: Stripe.Event;

  try {
    if (webhookSecret && sig) {
      event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
    } else {
      event = JSON.parse(rawBody) as Stripe.Event;
    }
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  try {
    switch (event.type) {

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
            message: `Rs. ${pi.amount.toLocaleString()} received via Stripe`,
            data: { orderId, paymentIntentId: pi.id },
            source: 'system',
          });
        }
        break;
      }

      case 'payment_intent.payment_failed': {
        const pi = event.data.object as Stripe.PaymentIntent;
        const orderId = pi.metadata?.orderId;
        if (orderId) {
          await db.order.update({
            where: { id: orderId },
            data: { paymentStatus: 'UNPAID', status: 'PENDING' },
          });
        }
        console.warn(`Payment failed for order ${orderId}: ${pi.last_payment_error?.message}`);
        break;
      }

      case 'charge.failed': {
        const charge = event.data.object as Stripe.Charge;
        const outcome = charge.outcome;
        if (outcome?.type === 'blocked') {
          console.warn(`Radar blocked charge ${charge.id} — reason: ${outcome.reason}, risk: ${outcome.risk_level}`);
          const piId = typeof charge.payment_intent === 'string' ? charge.payment_intent : null;
          if (piId) {
            const order = await db.order.findFirst({ where: { stripePaymentIntentId: piId } });
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
        console.warn(`Radar early fraud warning: ${efw.id}, type: ${efw.fraud_type}`);
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        const orderId = invoice.metadata?.orderId;
        if (orderId) {
          await db.order.update({
            where: { id: orderId },
            data: { paymentStatus: 'PAID', status: 'CONFIRMED', stripeInvoiceId: invoice.id },
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
        console.warn(`Invoice payment failed: ${invoice.id}, order: ${invoice.metadata?.orderId}`);
        break;
      }

      case 'invoice.finalized': {
        const invoice = event.data.object as Stripe.Invoice;
        const orderId = invoice.metadata?.orderId;
        if (orderId) {
          await db.order.update({ where: { id: orderId }, data: { stripeInvoiceId: invoice.id } });
        }
        break;
      }

      default:
        break;
    }
  } catch (handlerErr: any) {
    console.error(`Error handling Stripe event ${event.type}:`, handlerErr);
  }

  return NextResponse.json({ received: true });
}
