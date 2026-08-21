import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { broadcastRealtimeEvent } from '@/lib/realtime';

export const dynamic = 'force-dynamic';

// GET all orders (Admin only)
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== 'SUPERADMIN' && user.role !== 'ADMIN' && user.role !== 'STAFF')) {
      return NextResponse.json({ error: 'Unauthorized. Admin access required' }, { status: 403 });
    }

    const orders = await db.order.findMany({
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                images: true,
                productCode: true
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

    return NextResponse.json({ orders }, { status: 200 });
  } catch (error: any) {
    console.error('API GET Admin Orders Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PUT update order status/payment/tracking/notes (Admin only)
export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== 'SUPERADMIN' && user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized. Admin access required' }, { status: 403 });
    }

    const { orderId, status, paymentStatus, trackingNumber, notes } = await request.json();

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    const existingOrder = await db.order.findUnique({
      where: { id: orderId }
    });

    if (!existingOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const updated = await db.order.update({
      where: { id: orderId },
      data: {
        status: status || existingOrder.status,
        paymentStatus: paymentStatus || existingOrder.paymentStatus,
        trackingNumber: trackingNumber !== undefined ? trackingNumber : existingOrder.trackingNumber,
        notes: notes !== undefined ? notes : existingOrder.notes,
      },
      include: {
        items: true
      }
    });

    try {
      broadcastRealtimeEvent({
        type: 'ORDER_UPDATED',
        title: `Order Updated (${updated.orderNumber})`,
        message: `Status changed to ${updated.status} • Payment: ${updated.paymentStatus}`,
        data: updated,
        source: 'admin'
      });
    } catch (err) {
      console.warn('Realtime broadcast error:', err);
    }

    return NextResponse.json({
      success: true,
      message: 'Order updated successfully',
      order: updated
    }, { status: 200 });

  } catch (error: any) {
    console.error('API PUT Admin Order Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE order
export async function DELETE(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== 'SUPERADMIN' && user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized. Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('id');

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    await db.orderItem.deleteMany({ where: { orderId } });
    const deleted = await db.order.delete({ where: { id: orderId } });

    try {
      broadcastRealtimeEvent({
        type: 'ORDER_DELETED',
        title: `Order Deleted (${deleted.orderNumber})`,
        message: `Order was removed by admin`,
        data: { orderId, orderNumber: deleted.orderNumber },
        source: 'admin'
      });
    } catch (err) {
      console.warn('Realtime broadcast error:', err);
    }

    return NextResponse.json({ success: true, message: 'Order deleted successfully' }, { status: 200 });
  } catch (error: any) {
    console.error('API DELETE Order Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
