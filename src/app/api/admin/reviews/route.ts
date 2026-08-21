import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { broadcastRealtimeEvent } from '@/lib/realtime';

export const dynamic = 'force-dynamic';

// GET all reviews (Admin only)
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== 'SUPERADMIN' && user.role !== 'ADMIN' && user.role !== 'STAFF')) {
      return NextResponse.json({ error: 'Unauthorized. Admin access required' }, { status: 403 });
    }

    const reviews = await db.review.findMany({
      include: {
        product: {
          select: {
            id: true,
            name: true,
            productCode: true,
            images: true
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ reviews }, { status: 200 });
  } catch (error: any) {
    console.error('API GET Admin Reviews Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PUT approve/reject, feature, or reply to a review
export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== 'SUPERADMIN' && user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized. Admin access required' }, { status: 403 });
    }

    const { reviewId, isApproved, isFeatured, adminReply } = await request.json();

    if (!reviewId) {
      return NextResponse.json({ error: 'Review ID is required' }, { status: 400 });
    }

    const updated = await db.review.update({
      where: { id: reviewId },
      data: {
        isApproved: isApproved !== undefined ? Boolean(isApproved) : undefined,
        isFeatured: isFeatured !== undefined ? Boolean(isFeatured) : undefined,
        adminReply: adminReply !== undefined ? adminReply : undefined,
      },
      include: {
        product: true
      }
    });

    try {
      broadcastRealtimeEvent({
        type: 'REVIEW_UPDATED',
        title: `Review ${updated.isApproved ? 'Approved' : 'Updated'}`,
        message: `Review for "${updated.product.name}" updated live`,
        data: updated,
        source: 'admin'
      });
    } catch (err) {
      console.warn('Realtime broadcast error:', err);
    }

    return NextResponse.json({
      success: true,
      message: 'Review updated successfully',
      review: updated
    }, { status: 200 });

  } catch (error: any) {
    console.error('API PUT Admin Review Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE a review
export async function DELETE(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== 'SUPERADMIN' && user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized. Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const reviewId = searchParams.get('reviewId');

    if (!reviewId) {
      return NextResponse.json({ error: 'Review ID is required' }, { status: 400 });
    }

    await db.review.delete({
      where: { id: reviewId }
    });

    try {
      broadcastRealtimeEvent({
        type: 'REVIEW_DELETED',
        title: 'Review Deleted',
        message: 'Review removed by admin',
        data: { reviewId },
        source: 'admin'
      });
    } catch (err) {
      console.warn('Realtime broadcast error:', err);
    }

    return NextResponse.json({
      success: true,
      message: 'Review deleted successfully'
    }, { status: 200 });

  } catch (error: any) {
    console.error('API DELETE Admin Review Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
