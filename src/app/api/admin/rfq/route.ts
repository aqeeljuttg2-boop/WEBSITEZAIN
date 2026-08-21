import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { broadcastRealtimeEvent } from '@/lib/realtime';

export const dynamic = 'force-dynamic';

// GET all RFQs (Admin only)
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== 'SUPERADMIN' && user.role !== 'ADMIN' && user.role !== 'STAFF')) {
      return NextResponse.json({ error: 'Unauthorized. Admin access required' }, { status: 403 });
    }

    const rfqs = await db.rfq.findMany({
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                productCode: true,
                images: true
              }
            }
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            company: true,
            phone: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ rfqs }, { status: 200 });
  } catch (error: any) {
    console.error('API GET Admin RFQs Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PUT update RFQ status, notes, attachment
export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== 'SUPERADMIN' && user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized. Admin access required' }, { status: 403 });
    }

    const { rfqId, status, notes, attachmentUrl } = await request.json();

    if (!rfqId) {
      return NextResponse.json({ error: 'RFQ ID is required' }, { status: 400 });
    }

    const existingRfq = await db.rfq.findUnique({
      where: { id: rfqId }
    });

    if (!existingRfq) {
      return NextResponse.json({ error: 'RFQ not found' }, { status: 404 });
    }

    const updated = await db.rfq.update({
      where: { id: rfqId },
      data: {
        status: status || existingRfq.status,
        notes: notes !== undefined ? notes : existingRfq.notes,
        attachmentUrl: attachmentUrl !== undefined ? attachmentUrl : existingRfq.attachmentUrl,
      },
      include: {
        items: true,
      }
    });

    try {
      broadcastRealtimeEvent({
        type: 'RFQ_UPDATED',
        title: `RFQ Updated (${updated.rfqNumber})`,
        message: `Quote status changed to ${updated.status}`,
        data: updated,
        source: 'admin'
      });
    } catch (err) {
      console.warn('Realtime broadcast error:', err);
    }

    return NextResponse.json({
      success: true,
      message: 'RFQ updated successfully',
      rfq: updated
    }, { status: 200 });

  } catch (error: any) {
    console.error('API PUT Admin RFQ Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE RFQ
export async function DELETE(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== 'SUPERADMIN' && user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized. Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const rfqId = searchParams.get('id');

    if (!rfqId) {
      return NextResponse.json({ error: 'RFQ ID is required' }, { status: 400 });
    }

    await db.rfqItem.deleteMany({ where: { rfqId } });
    const deleted = await db.rfq.delete({ where: { id: rfqId } });

    try {
      broadcastRealtimeEvent({
        type: 'RFQ_DELETED',
        title: `RFQ Deleted (${deleted.rfqNumber})`,
        message: `Quote request was deleted`,
        data: { rfqId, rfqNumber: deleted.rfqNumber },
        source: 'admin'
      });
    } catch (err) {
      console.warn('Realtime broadcast error:', err);
    }

    return NextResponse.json({ success: true, message: 'RFQ deleted successfully' }, { status: 200 });
  } catch (error: any) {
    console.error('API DELETE Admin RFQ Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
