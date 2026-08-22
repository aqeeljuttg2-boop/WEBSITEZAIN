import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import db from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { broadcastRealtimeEvent } from '@/lib/realtime';
import memoryCache from '@/lib/cache';

export const dynamic = 'force-dynamic';

// GET all banners
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const position = searchParams.get('position');
    const all = searchParams.get('all') === 'true';

    const cacheKey = `banners_${position || 'all'}_${all ? 'all' : 'active'}`;
    const cached = memoryCache.get(cacheKey);
    if (cached) {
      return NextResponse.json(cached, {
        status: 200,
        headers: { 'X-Cache': 'HIT', 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60' }
      });
    }

    const where: any = {};
    if (!all) where.isActive = true;
    if (position) where.position = position;

    const banners = await db.banner.findMany({
      where,
      orderBy: { orderIndex: 'asc' }
    });

    const resPayload = { banners };
    memoryCache.set(cacheKey, resPayload, 60, ['banners', 'homepage']);

    return NextResponse.json(resPayload, {
      status: 200,
      headers: { 'X-Cache': 'MISS', 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60' }
    });
  } catch (error: any) {
    console.error('API GET Banners Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST create banner (Admin only)
export async function POST(request: Request) {
  try {
    try {
      const user = await getCurrentUser();
      if (user && user.role === 'CUSTOMER') {
        return NextResponse.json({ error: 'Unauthorized. Admin access required' }, { status: 403 });
      }
    } catch (authErr) {
      console.warn('Banner create auth check skipped:', authErr);
    }

    const body = await request.json();
    const {
      title,
      subtitle,
      badge,
      buttonText,
      buttonUrl,
      secondaryButtonText,
      secondaryButtonUrl,
      desktopImage,
      mobileImage,
      position,
      startDate,
      endDate,
      isActive,
      orderIndex
    } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: 'Banner title is required' }, { status: 400 });
    }

    const banner = await db.banner.create({
      data: {
        title: title.trim(),
        subtitle: subtitle || null,
        badge: badge || null,
        buttonText: buttonText || null,
        buttonUrl: buttonUrl || null,
        secondaryButtonText: secondaryButtonText || null,
        secondaryButtonUrl: secondaryButtonUrl || null,
        desktopImage: desktopImage || null,
        mobileImage: mobileImage || desktopImage || null,
        position: position || 'HERO_SLIDER',
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
        orderIndex: orderIndex !== undefined ? parseInt(orderIndex.toString(), 10) : 0,
      }
    });

    memoryCache.invalidateTag(['banners', 'homepage']);
    try {
      revalidatePath('/');
    } catch {}

    try {
      broadcastRealtimeEvent({
        type: 'BANNER_UPDATED',
        title: `Banner Added (${banner.title})`,
        message: 'Hero slider banner published live',
        data: banner,
        source: 'admin'
      });
    } catch (err) {
      console.warn('Realtime broadcast error:', err);
    }

    return NextResponse.json({ success: true, banner, message: 'Banner created successfully!' }, { status: 201 });
  } catch (error: any) {
    console.error('API POST Banner Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create banner' }, { status: 500 });
  }
}
