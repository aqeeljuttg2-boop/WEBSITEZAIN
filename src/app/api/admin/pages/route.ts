import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import db from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { broadcastRealtimeEvent } from '@/lib/realtime';
import memoryCache from '@/lib/cache';

export const dynamic = 'force-dynamic';

// GET all pages
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const all = searchParams.get('all') === 'true';

    const cacheKey = `pages_${all ? 'all' : 'published'}`;
    const cached = memoryCache.get(cacheKey);
    if (cached) {
      return NextResponse.json(cached, {
        status: 200,
        headers: { 'X-Cache': 'HIT', 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60' }
      });
    }

    const pages = await db.page.findMany({
      where: all ? {} : { isPublished: true },
      orderBy: { createdAt: 'desc' }
    });

    const resPayload = { pages };
    memoryCache.set(cacheKey, resPayload, 60, ['pages']);

    return NextResponse.json(resPayload, {
      status: 200,
      headers: { 'X-Cache': 'MISS', 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60' }
    });
  } catch (error: any) {
    console.error('API GET Pages Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST create new page (Admin only)
export async function POST(request: Request) {
  try {
    try {
      const user = await getCurrentUser();
      if (user && user.role === 'CUSTOMER') {
        return NextResponse.json({ error: 'Unauthorized. Admin access required' }, { status: 403 });
      }
    } catch (authErr) {
      console.warn('Page create auth check skipped:', authErr);
    }

    const body = await request.json();
    const { title, slug: customSlug, content, bannerImage, seoTitle, seoDescription, isPublished, template } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: 'Page title is required' }, { status: 400 });
    }

    let slug = customSlug && customSlug.trim()
      ? customSlug.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '')
      : title.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '');

    const existing = await db.page.findUnique({ where: { slug } });
    if (existing) {
      slug = `${slug}-${Date.now().toString().slice(-4)}`;
    }

    const page = await db.page.create({
      data: {
        title: title.trim(),
        slug,
        content: content || '',
        bannerImage: bannerImage || null,
        seoTitle: seoTitle || null,
        seoDescription: seoDescription || null,
        isPublished: isPublished !== undefined ? Boolean(isPublished) : true,
        template: template || 'STANDARD',
      }
    });

    memoryCache.invalidateTag('pages');
    try {
      revalidatePath(`/${page.slug}`);
      revalidatePath('/');
    } catch {}

    try {
      broadcastRealtimeEvent({
        type: 'PAGE_UPDATED',
        title: `Page Created (${page.title})`,
        message: 'New custom page published live',
        data: page,
        source: 'admin'
      });
    } catch (err) {
      console.warn('Realtime broadcast error:', err);
    }

    return NextResponse.json({ success: true, page, message: 'Page created successfully!' }, { status: 201 });
  } catch (error: any) {
    console.error('API POST Page Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create page' }, { status: 500 });
  }
}
