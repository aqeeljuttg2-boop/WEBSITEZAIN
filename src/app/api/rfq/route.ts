import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { broadcastRealtimeEvent } from '@/lib/realtime';

// GET customer's own RFQs
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rfqs = await db.rfq.findMany({
      where: { userId: user.id },
      include: {
        items: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ rfqs }, { status: 200 });
  } catch (error: any) {
    console.error('API GET Customer RFQs Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST submit a new RFQ (Request for Quote)
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    const body = await request.json();
    const name = body.name || body.fullName || user?.name || '';
    const email = body.email || user?.email || '';
    const phone = body.phone || user?.phone || '';
    const whatsapp = body.whatsapp || user?.whatsapp || '';
    const company = body.company || body.companyName || user?.company || '';
    const country = body.country || user?.country || '';
    const notes = body.notes || body.message || '';
    const attachmentUrl = body.attachmentUrl || '';
    const items = body.items || [];

    if (!name || !email || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Name, email, and at least one item are required' }, { status: 400 });
    }

    // Generate unique RFQ Number
    const count = await db.rfq.count();
    const rfqNumber = `RFQ-2026-${(10001 + count).toString()}`;

    // Resolve any product details if missing
    const resolvedItems = await Promise.all(
      items.map(async (item: any) => {
        let code = item.productCode || 'CUSTOM';
        let prodName = item.productName || item.title || 'Custom Instrument Inquiry';
        if (item.productId && (code === 'CUSTOM' || !item.productName)) {
          const prod = await db.product.findUnique({
            where: { id: item.productId },
            select: { productCode: true, name: true }
          });
          if (prod) {
            code = prod.productCode || code;
            prodName = prod.name || prodName;
          }
        }
        return {
          productId: item.productId || null,
          productCode: code,
          productName: prodName,
          quantity: parseInt(item.quantity || '1', 10),
          requiredSize: item.requiredSize || '',
          material: item.material || '',
          finish: item.finish || '',
          additionalRequirements: item.additionalRequirements || item.notes || '',
        };
      })
    );

    // Create the RFQ transaction
    const rfq = await db.rfq.create({
      data: {
        rfqNumber,
        userId: user?.id || null,
        name,
        company,
        email: email.toLowerCase(),
        phone,
        whatsapp,
        country,
        notes,
        attachmentUrl,
        items: {
          create: resolvedItems,
        },
      },
      include: {
        items: true,
      },
    });

    try {
      broadcastRealtimeEvent({
        type: 'RFQ_CREATED',
        title: `New RFQ Quote Request (${rfq.rfqNumber})`,
        message: `${name} ${company ? `(${company})` : ''} requested a quote for ${resolvedItems.length} instrument(s)`,
        data: rfq,
        source: 'storefront'
      });
    } catch (err) {
      console.warn('Realtime broadcast error:', err);
    }

    return NextResponse.json({
      success: true,
      message: 'Quote request submitted successfully',
      rfqNumber: rfq.rfqNumber,
      rfq,
    }, { status: 201 });

  } catch (error: any) {
    console.error('API POST RFQ Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
