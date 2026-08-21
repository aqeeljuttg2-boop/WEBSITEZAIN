import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const orderNumber = searchParams.get('orderNumber');

    if (!orderNumber) {
      return NextResponse.json({ error: 'Order number is required' }, { status: 400 });
    }

    const order = await db.order.findUnique({
      where: { orderNumber: orderNumber.toUpperCase().trim() },
      select: {
        orderNumber: true,
        status: true,
        paymentStatus: true,
        trackingNumber: true,
        createdAt: true,
        total: true,
      }
    });

    if (!order) {
      return NextResponse.json({ error: 'No order found with this reference code.' }, { status: 404 });
    }

    return NextResponse.json({ order }, { status: 200 });

  } catch (error: any) {
    console.error('API GET Order Tracking Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
