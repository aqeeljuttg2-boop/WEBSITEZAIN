import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET brand
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const brand = await db.brand.findFirst({
      where: {
        OR: [{ id }, { slug: id }]
      },
      include: {
        products: {
          select: { id: true, name: true, slug: true, singlePrice: true, images: true }
        }
      }
    });

    if (!brand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
    }

    return NextResponse.json({ brand }, { status: 200 });
  } catch (error: any) {
    console.error('API GET Brand Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PUT update brand (Admin only)
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
      console.warn('Brand update auth check skipped:', authErr);
    }

    const existing = await db.brand.findFirst({
      where: {
        OR: [{ id }, { slug: id }]
      }
    });
    if (!existing) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
    }

    const body = await request.json();
    const { name, slug, logo, description, websiteUrl, isActive, orderIndex } = body;

    let finalSlug = existing.slug;
    if (slug && slug.trim() && slug.trim() !== existing.slug) {
      finalSlug = slug.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '');
      const dupe = await db.brand.findFirst({ where: { slug: finalSlug, NOT: { id: existing.id } } });
      if (dupe) finalSlug = `${finalSlug}-${Date.now().toString().slice(-4)}`;
    }

    const updated = await db.brand.update({
      where: { id: existing.id },
      data: {
        name: name !== undefined ? name.trim() : existing.name,
        slug: finalSlug,
        logo: logo !== undefined ? (logo ? logo.trim() : null) : existing.logo,
        description: description !== undefined ? (description ? description.trim() : null) : existing.description,
        websiteUrl: websiteUrl !== undefined ? (websiteUrl ? websiteUrl.trim() : null) : existing.websiteUrl,
        isActive: isActive !== undefined ? Boolean(isActive) : existing.isActive,
        orderIndex: orderIndex !== undefined ? parseInt(orderIndex.toString(), 10) : existing.orderIndex,
      }
    });

    return NextResponse.json({ success: true, brand: updated, message: 'Brand updated successfully!' }, { status: 200 });
  } catch (error: any) {
    console.error('API PUT Brand Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update brand' }, { status: 500 });
  }
}

// DELETE brand (Admin only)
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
      console.warn('Brand delete auth check skipped:', authErr);
    }

    const existing = await db.brand.findFirst({
      where: {
        OR: [{ id }, { slug: id }]
      }
    });
    if (!existing) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
    }

    await db.product.updateMany({
      where: { brandId: existing.id },
      data: { brandId: null }
    });

    await db.brand.delete({ where: { id: existing.id } });

    return NextResponse.json({ success: true, message: 'Brand deleted successfully' }, { status: 200 });
  } catch (error: any) {
    console.error('API DELETE Brand Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete brand' }, { status: 500 });
  }
}
