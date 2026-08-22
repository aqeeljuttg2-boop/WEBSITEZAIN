import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import db from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { broadcastRealtimeEvent } from '@/lib/realtime';
import memoryCache from '@/lib/cache';

export const dynamic = 'force-dynamic';

// GET single page by ID or Slug
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const page = await db.page.findFirst({
      where: {
        OR: [{ id }, { slug: id }]
      }
    });

    if (!page) return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    return NextResponse.json({ page }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PUT update page
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    try {
      const user = await getCurrentUser();
      if (user && user.role === 'CUSTOMER') {
        return NextResponse.json({ error: 'Unauthorized. Admin access required' }, { status: 403 });
      }
    } catch (authErr) {
      console.warn('Page update auth check skipped:', authErr);
    }

    const existing = await db.page.findFirst({
      where: { OR: [{ id }, { slug: id }] }
    });
    if (!existing) return NextResponse.json({ error: 'Page not found' }, { status: 404 });

    const body = await request.json();
    const { title, slug, content, bannerImage, seoTitle, seoDescription, isPublished, template } = body;

    let finalSlug = existing.slug;
    if (slug && slug.trim() && slug.trim() !== existing.slug) {
      finalSlug = slug.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '');
      const dupe = await db.page.findFirst({ where: { slug: finalSlug, NOT: { id: existing.id } } });
      if (dupe) finalSlug = `${finalSlug}-${Date.now().toString().slice(-4)}`;
    }

    const updated = await db.page.update({
      where: { id: existing.id },
      data: {
        title: title !== undefined ? title.trim() : existing.title,
        slug: finalSlug,
        content: content !== undefined ? content : existing.content,
        bannerImage: bannerImage !== undefined ? bannerImage : existing.bannerImage,
        seoTitle: seoTitle !== undefined ? seoTitle : existing.seoTitle,
        seoDescription: seoDescription !== undefined ? seoDescription : existing.seoDescription,
        isPublished: isPublished !== undefined ? Boolean(isPublished) : existing.isPublished,
        template: template !== undefined ? template : existing.template,
      }
    });

    memoryCache.invalidateTag('pages');
    try {
      revalidatePath(`/${updated.slug}`);
      revalidatePath('/');
    } catch {}

    try {
      broadcastRealtimeEvent({
        type: 'PAGE_UPDATED',
        title: `Page Updated (${updated.title})`,
        message: 'Custom page changes synced live',
        data: updated,
        source: 'admin'
      });
    } catch (err) {
      console.warn('Realtime broadcast error:', err);
    }

    return NextResponse.json({ success: true, page: updated, message: 'Page updated successfully!' }, { status: 200 });
  } catch (error: any) {
    console.error('API PUT Page Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update page' }, { status: 500 });
  }
}

// DELETE page
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    try {
      const user = await getCurrentUser();
      if (user && user.role === 'CUSTOMER') {
        return NextResponse.json({ error: 'Unauthorized. Admin access required' }, { status: 403 });
      }
    } catch (authErr) {
      console.warn('Page delete auth check skipped:', authErr);
    }

    const existing = await db.page.findFirst({
      where: { OR: [{ id }, { slug: id }] }
    });
    if (!existing) return NextResponse.json({ error: 'Page not found' }, { status: 404 });

    await db.page.delete({ where: { id: existing.id } });

    memoryCache.invalidateTag('pages');
    try {
      revalidatePath(`/${existing.slug}`);
      revalidatePath('/');
    } catch {}

    return NextResponse.json({ success: true, message: 'Page deleted successfully' }, { status: 200 });
  } catch (error: any) {
    console.error('API DELETE Page Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete page' }, { status: 500 });
  }
}
