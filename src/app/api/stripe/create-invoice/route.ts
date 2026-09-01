import { NextResponse } from 'next/server';
import stripe from '@/lib/stripe';
import db from '@/lib/db';

// POST /api/stripe/create-invoice
// Creates a Stripe Invoice for an existing order (B2B / offline billing flow).
// The invoice is immediately finalised and an email is sent to the customer.
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json({ error: 'orderId is required' }, { status: 400 });
    }

    // Load the full order from the database
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.stripeInvoiceId) {
      return NextResponse.json(
        { error: 'Invoice already exists', invoiceId: order.stripeInvoiceId },
        { status: 409 }
      );
    }

    // Find or create a Stripe Customer
    let customerId: string;
    if (order.stripeCustomerId) {
      customerId = order.stripeCustomerId;
    } else {
      const existing = await stripe.customers.list({
        email: order.customerEmail,
        limit: 1,
      });

      if (existing.data.length > 0) {
        customerId = existing.data[0].id;
      } else {
        const customer = await stripe.customers.create({
          email: order.customerEmail,
          name: order.customerName,
          phone: order.customerPhone ?? undefined,
          metadata: {
            orderId: order.id,
            orderNumber: order.orderNumber,
            source: 'lashtweezerslounge.com',
          },
        });
        customerId = customer.id;
      }

      // Persist the customer ID on the order
      await db.order.update({
        where: { id: orderId },
        data: { stripeCustomerId: customerId },
      });
    }

    // Create line items on the customer — each order item becomes an invoice item
    for (const item of order.items) {
      // PKR is a zero-decimal currency in Stripe — amount is in whole PKR, not paisas
      await stripe.invoiceItems.create({
        customer: customerId,
        amount: Math.round(item.pricePerUnit * item.quantity), // total for this line
        currency: 'pkr',
        quantity: item.quantity,
        description: `${item.productName} (${item.productCode})`,
        metadata: { orderId: order.id, productId: item.productId ?? '' },
      });
    }

    // Add shipping as a line item if applicable
    if (order.shippingCost > 0) {
      await stripe.invoiceItems.create({
        customer: customerId,
        amount: Math.round(order.shippingCost),
        currency: 'pkr',
        quantity: 1,
        description: 'Shipping & Handling',
        metadata: { orderId: order.id },
      });
    }

    // Create and finalise the invoice
    const invoice = await stripe.invoices.create({
      customer: customerId,
      collection_method: 'send_invoice',
      days_until_due: 7,
      currency: 'pkr',
      metadata: {
        orderId: order.id,
        orderNumber: order.orderNumber,
      },
      custom_fields: [
        { name: 'Order #', value: order.orderNumber },
      ],
      footer: 'Thank you for your business — Lash Tweezers Lounge',
      auto_advance: true,
    });

    const finalised = await stripe.invoices.finalizeInvoice(invoice.id);

    // Send the invoice email to the customer
    await stripe.invoices.sendInvoice(finalised.id);

    // Persist invoice ID on order
    await db.order.update({
      where: { id: orderId },
      data: { stripeInvoiceId: finalised.id },
    });

    return NextResponse.json({
      success: true,
      invoiceId: finalised.id,
      invoiceUrl: finalised.hosted_invoice_url,
      invoicePdf: finalised.invoice_pdf,
      status: finalised.status,
    });
  } catch (error: any) {
    console.error('Create invoice error:', error);
    return NextResponse.json(
      { error: error?.message ?? 'Failed to create invoice' },
      { status: 500 }
    );
  }
}
