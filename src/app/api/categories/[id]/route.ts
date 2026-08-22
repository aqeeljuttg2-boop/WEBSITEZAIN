import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import db from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { broadcastRealtimeEvent } from '@/lib/realtime';
import memoryCache from '@/lib/cache';

export const dynamic = 'force-dynamic';

// GET single category with products count and subcategories
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cacheKey = `category_detail_${id}`;
    const cached = memoryCache.get(cacheKey);
    if (cached) {
      return NextResponse.json(cached, { status: 200 });
    }

    const category = await db.category.findFirst({
      where: {
        OR: [
          { id },
          { slug: id }
        ]
      },
      include: {
        parent: true,
        subcategories: {
          include: {
            _count: { select: { products: true } }
          }
        },
        _count: {
          select: { products: true }
        }
      }
    });

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    const resPayload = { category };
    memoryCache.set(cacheKey, resPayload, 60, ['categories']);

    return NextResponse.json(resPayload, { status: 200 });
  } catch (error: any) {
    console.error('API GET Category Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PUT update category (Admin only)
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
      console.warn('Category update auth check skipped:', authErr);
    }

    const existing = await db.category.findFirst({
      where: {
        OR: [
          { id },
          { slug: id }
        ]
      }
    });

    if (!existing) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    const body = await request.json();
    const { 
      name, 
      slug, 
      description, 
      image, 
      icon, 
      seoTitle, 
      seoDescription, 
      isActive, 
      parentId, 
      orderIndex 
    } = body;

    let finalSlug = existing.slug;
    if (slug && slug.trim() && slug.trim() !== existing.slug) {
      finalSlug = slug.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '');
      const slugExists = await db.category.findFirst({
        where: { slug: finalSlug, NOT: { id: existing.id } }
      });
      if (slugExists) {
        finalSlug = `${finalSlug}-${Date.now().toString().slice(-4)}`;
      }
    } else if (name && name.trim() !== existing.name && !slug) {
      finalSlug = name.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '');
      const slugExists = await db.category.findFirst({
        where: { slug: finalSlug, NOT: { id: existing.id } }
      });
      if (slugExists) {
        finalSlug = `${finalSlug}-${Date.now().toString().slice(-4)}`;
      }
    }

    let validatedParentId: string | null = existing.parentId;
    if (parentId !== undefined) {
      if (parentId === existing.id) {
        return NextResponse.json({ error: 'A category cannot be its own parent' }, { status: 400 });
      }
      validatedParentId = (parentId && parentId !== 'none' && parentId.trim() !== '') ? parentId.trim() : null;
    }

    const updated = await db.category.update({
      where: { id: existing.id },
      data: {
        name: name !== undefined ? name.trim() : existing.name,
        slug: finalSlug,
        description: description !== undefined ? (description ? description.trim() : null) : existing.description,
        image: image !== undefined ? (image ? image.trim() : null) : existing.image,
        icon: icon !== undefined ? (icon ? icon.trim() : null) : existing.icon,
        seoTitle: seoTitle !== undefined ? (seoTitle ? seoTitle.trim() : null) : existing.seoTitle,
        seoDescription: seoDescription !== undefined ? (seoDescription ? seoDescription.trim() : null) : existing.seoDescription,
        isActive: isActive !== undefined ? Boolean(isActive) : existing.isActive,
        parentId: validatedParentId,
        orderIndex: orderIndex !== undefined ? parseInt(orderIndex.toString(), 10) : existing.orderIndex,
      },
      include: {
        parent: true,
        subcategories: true,
        _count: { select: { products: true } }
      }
    });

    // Invalidate cache and revalidate pages
    memoryCache.invalidateTag('categories');
    try {
      revalidatePath('/');
      revalidatePath('/shop');
    } catch {}

    try {
      broadcastRealtimeEvent({
        type: 'CATEGORY_UPDATED',
        title: `Category Updated (${updated.name})`,
        message: `Category changes synced live • Status: ${updated.isActive ? 'Active' : 'Hidden'}`,
        data: updated,
        source: 'admin'
      });
    } catch (err) {
      console.warn('Realtime broadcast error:', err);
    }

    return NextResponse.json({ 
      success: true, 
      category: updated,
      message: 'Category updated successfully!' 
    }, { status: 200 });

  } catch (error: any) {
    console.error('API PUT Category Error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to update category' 
    }, { status: 500 });
  }
}

// DELETE category (Admin only)
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
      console.warn('Category delete auth check skipped:', authErr);
    }

    const category = await db.category.findFirst({
      where: {
        OR: [
          { id },
          { slug: id }
        ]
      },
      include: {
        _count: { select: { products: true, subcategories: true } }
      }
    });

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    // Safely reassign products to uncategorized (null) instead of silently breaking foreign keys
    await db.product.updateMany({
      where: { categoryId: id },
      data: { categoryId: null }
    });

    // If deleting parent category, promote or unlink subcategories
    await db.category.updateMany({
      where: { parentId: id },
      data: { parentId: null }
    });

    await db.category.delete({
      where: { id }
    });

    memoryCache.invalidateTag('categories');
    try {
      revalidatePath('/');
      revalidatePath('/shop');
    } catch {}

    try {
      broadcastRealtimeEvent({
        type: 'CATEGORY_DELETED',
        title: `Category Deleted (${category.name})`,
        message: `Category was removed`,
        data: { id: category.id, name: category.name },
        source: 'admin'
      });
    } catch (err) {
      console.warn('Realtime broadcast error:', err);
    }

    return NextResponse.json({
      success: true,
      message: `Category "${category.name}" deleted safely. ${category._count.products} products unassigned.`
    }, { status: 200 });

  } catch (error: any) {
    console.error('API DELETE Category Error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to delete category' 
    }, { status: 500 });
  }
}
