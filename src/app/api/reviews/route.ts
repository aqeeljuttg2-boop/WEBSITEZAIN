import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { broadcastRealtimeEvent } from '@/lib/realtime';

// GET public approved reviews (optional filter by productId)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const skip = (page - 1) * limit;

    const where: any = { isApproved: true };
    if (productId) {
      where.productId = productId;
    }

    const [reviews, total] = await Promise.all([
      db.review.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          product: {
            select: { id: true, name: true, slug: true, images: true }
          }
        }
      }),
      db.review.count({ where })
    ]);

    return NextResponse.json({
      reviews,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    }, { status: 200 });
  } catch (error: any) {
    console.error('API GET Reviews Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST submit a review
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    const { productId, name, email, rating, comment } = await request.json();

    if (!productId || !name || !email || !rating) {
      return NextResponse.json({ error: 'Product ID, name, email, and rating are required' }, { status: 400 });
    }

    const ratingVal = parseInt(rating, 10);
    if (ratingVal < 1 || ratingVal > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 });
    }

    // Verify product exists
    const product = await db.product.findUnique({
      where: { id: productId }
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const review = await db.review.create({
      data: {
        productId,
        userId: user?.id || null,
        name,
        email: email.toLowerCase(),
        rating: ratingVal,
        comment: comment || '',
        isApproved: false, // Must be approved by admin
      }
    });

    try {
      broadcastRealtimeEvent({
        type: 'REVIEW_CREATED',
        title: `New Review Submitted (${ratingVal}★)`,
        message: `${name} reviewed "${product.name}"`,
        data: review,
        source: 'storefront'
      });
    } catch (err) {
      console.warn('Realtime broadcast error:', err);
    }

    return NextResponse.json({
      success: true,
      message: 'Review submitted. It will appear on the site once approved by our team.',
      review
    }, { status: 201 });

  } catch (error: any) {
    console.error('API POST Review Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
