import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { broadcastRealtimeEvent } from '@/lib/realtime';

// GET customer's own orders
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orders = await db.order.findMany({
      where: { userId: user.id },
      include: {
        items: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ orders }, { status: 200 });
  } catch (error: any) {
    console.error('API GET Customer Orders Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST create a new order (online checkout)
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    const body = await request.json();
    const {
      customerName,
      customerEmail,
      customerPhone,
      customerWhatsapp,
      companyName,
      shippingAddress, // JSON object containing address, city, country, zip
      paymentMethod, // "CARD" or "OFFLINE"
      couponCode,
      items, // array of { productId, quantity }
      notes
    } = body;

    if (!customerName || !customerEmail || !shippingAddress || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Required checkout fields are missing' }, { status: 400 });
    }

    // Verify products, MOQs, and calculate prices
    let subtotal = 0;
    const orderItemsToCreate = [];

    for (const cartItem of items) {
      const { productId, quantity } = cartItem;

      const product = await db.product.findUnique({
        where: { id: productId },
        include: {
          pricingTiers: {
            orderBy: { minQuantity: 'asc' }
          }
        }
      });

      if (!product) {
        return NextResponse.json({ error: `Product not found: ${productId}` }, { status: 404 });
      }

      const validQty = Math.max(1, parseInt(quantity?.toString() || '1', 10));

      // Determine price based on quantity tiers
      let unitPrice = product.singlePrice;
      if (product.pricingTiers && product.pricingTiers.length > 0) {
        const matchingTier = product.pricingTiers.find(tier => {
          if (tier.maxQuantity === null) {
            return validQty >= tier.minQuantity;
          }
          return validQty >= tier.minQuantity && validQty <= tier.maxQuantity;
        });

        if (matchingTier) {
          unitPrice = matchingTier.pricePerUnit;
        }
      }

      const itemTotalPrice = unitPrice * validQty;
      subtotal += itemTotalPrice;

      orderItemsToCreate.push({
        productId: product.id,
        productCode: product.productCode,
        productName: product.name,
        quantity: validQty,
        pricePerUnit: unitPrice,
        totalPrice: itemTotalPrice,
      });
    }

    // Handle coupon code
    let discount = 0;
    if (couponCode) {
      const coupon = await db.coupon.findUnique({
        where: { code: couponCode.toUpperCase() }
      });

      if (coupon && coupon.status === 'ACTIVE') {
        const now = new Date();
        const startOk = !coupon.startDate || now >= new Date(coupon.startDate);
        const endOk = !coupon.endDate || now <= new Date(coupon.endDate);
        const limitOk = !coupon.usageLimit || coupon.usageCount < coupon.usageLimit;
        const minOrderOk = subtotal >= coupon.minOrderValue;

        if (startOk && endOk && limitOk && minOrderOk) {
          if (coupon.discountType === 'PERCENTAGE') {
            discount = (subtotal * coupon.value) / 100;
            if (coupon.maxDiscountAmount && discount > coupon.maxDiscountAmount) {
              discount = coupon.maxDiscountAmount;
            }
          } else if (coupon.discountType === 'FIXED') {
            discount = coupon.value;
          }

          // Update coupon usage count
          await db.coupon.update({
            where: { id: coupon.id },
            data: { usageCount: { increment: 1 } }
          });
        }
      }
    }

    // Calculate shipping and tax from settings
    const taxSetting = await db.setting.findUnique({ where: { key: 'taxRate' } });
    const taxRate = taxSetting ? parseFloat(taxSetting.value) : 0.05;

    const shipSetting = await db.setting.findUnique({ where: { key: 'shippingRate' } });
    const freeShipSetting = await db.setting.findUnique({ where: { key: 'freeShippingThreshold' } });
    
    const baseShipping = shipSetting ? parseFloat(shipSetting.value) : 150.00;
    const freeThreshold = freeShipSetting ? parseFloat(freeShipSetting.value) : 2500.00;

    let shippingCost = subtotal >= freeThreshold ? 0 : baseShipping;
    
    // For wholesale B2B offline orders, shipping is often quoted separately, so default to 0 if payment offline is chosen and subtotal is large
    if (paymentMethod === 'OFFLINE' && subtotal >= 5000) {
      shippingCost = 0;
    }

    const taxAmount = (subtotal - discount) * taxRate;
    const total = subtotal - discount + taxAmount + shippingCost;

    // Generate Order Number
    const orderCount = await db.order.count();
    const orderNumber = `ORD-2026-${(10001 + orderCount).toString()}`;

    // Create the Order
    const order = await db.order.create({
      data: {
        orderNumber,
        userId: user?.id || null,
        customerName,
        customerEmail: customerEmail.toLowerCase(),
        customerPhone: customerPhone || '',
        customerWhatsapp: customerWhatsapp || '',
        companyName: companyName || '',
        shippingAddress: typeof shippingAddress === 'string' ? shippingAddress : JSON.stringify(shippingAddress),
        subtotal,
        discount,
        shippingCost,
        tax: taxAmount,
        total,
        status: 'PENDING',
        paymentMethod,
        paymentStatus: paymentMethod === 'CARD' ? 'PAID' : 'UNPAID', // mock CARD as instantly paid, OFFLINE as unpaid
        notes: notes || '',
        items: {
          create: orderItemsToCreate,
        },
      },
      include: {
        items: true,
      },
    });

    // Real-time live event broadcast
    try {
      broadcastRealtimeEvent({
        type: 'ORDER_CREATED',
        title: `New Order Received (${order.orderNumber})`,
        message: `${customerName} placed an order for Rs. ${total.toLocaleString()}`,
        data: order,
        source: 'storefront'
      });
    } catch (realtimeErr) {
      console.warn('Realtime broadcast failed:', realtimeErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Order placed successfully',
      orderNumber: order.orderNumber,
      order,
    }, { status: 201 });

  } catch (error: any) {
    console.error('API POST Checkout Order Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
