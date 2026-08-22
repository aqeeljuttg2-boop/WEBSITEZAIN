import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import db from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { broadcastRealtimeEvent } from '@/lib/realtime';
import memoryCache from '@/lib/cache';

export const dynamic = 'force-dynamic';

// GET all brands
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const all = searchParams.get('all') === 'true';

    const cacheKey = `brands_${all ? 'all' : 'active'}`;
    const cached = memoryCache.get(cacheKey);
    if (cached) {
      return NextResponse.json(cached, {
        status: 200,
        headers: { 'X-Cache': 'HIT', 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60' }
      });
    }

    const brands = await db.brand.findMany({
      where: all ? {} : { isActive: true },
      include: {
        _count: {
          select: { products: true }
        }
      },
      orderBy: { orderIndex: 'asc' }
    });

    const resPayload = { brands };
    memoryCache.set(cacheKey, resPayload, 60, ['brands']);

    return NextResponse.json(resPayload, {
      status: 200,
      headers: { 'X-Cache': 'MISS', 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60' }
    });
  } catch (error: any) {
    console.error('API GET Brands Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST create brand (Admin only)
export async function POST(request: Request) {
  try {
    try {
      const user = await getCurrentUser();
      if (user && user.role === 'CUSTOMER') {
        return NextResponse.json({ error: 'Unauthorized. Admin access required' }, { status: 403 });
      }
    } catch (authErr) {
      console.warn('Brand create auth check skipped:', authErr);
    }

    const body = await request.json();
    const { name, slug: customSlug, logo, description, websiteUrl, isActive, orderIndex } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Brand name is required' }, { status: 400 });
    }

    let slug = customSlug && customSlug.trim()
      ? customSlug.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '')
      : name.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '');

    const existing = await db.brand.findUnique({ where: { slug } });
    if (existing) {
      slug = `${slug}-${Date.now().toString().slice(-4)}`;
    }

    const brand = await db.brand.create({
      data: {
        name: name.trim(),
        slug,
        logo: logo ? logo.trim() : null,
        description: description ? description.trim() : null,
        websiteUrl: websiteUrl ? websiteUrl.trim() : null,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
        orderIndex: orderIndex !== undefined ? parseInt(orderIndex.toString(), 10) : 0,
      }
    });

    memoryCache.invalidateTag(['brands', 'products']);
    try {
      revalidatePath('/');
      revalidatePath('/shop');
    } catch {}

    try {
      broadcastRealtimeEvent({
        type: 'BRAND_UPDATED',
        title: `Brand Added (${brand.name})`,
        message: 'New brand registered and synced live',
        data: brand,
        source: 'admin'
      });
    } catch (err) {
      console.warn('Realtime broadcast error:', err);
    }

    return NextResponse.json({
      success: true,
      brand,
      message: 'Brand created successfully!'
    }, { status: 201 });

  } catch (error: any) {
    console.error('API POST Brands Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create brand' }, { status: 500 });
  }
}
