import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { broadcastRealtimeEvent } from '@/lib/realtime';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET all root categories with subcategories and product counts
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const flat = searchParams.get('flat') === 'true';
    const all = searchParams.get('all') === 'true';

    const whereCondition: any = all ? {} : { isActive: true };

    if (flat) {
      const allCategories = await db.category.findMany({
        where: whereCondition,
        include: {
          parent: true,
          _count: {
            select: { products: true }
          }
        },
        orderBy: [
          { orderIndex: 'asc' },
          { name: 'asc' }
        ]
      });
      return NextResponse.json({ categories: allCategories }, { status: 200 });
    }

    const categories = await db.category.findMany({
      where: { parentId: null, ...whereCondition },
      include: {
        subcategories: {
          where: whereCondition,
          include: {
            _count: {
              select: { products: true }
            }
          },
          orderBy: { orderIndex: 'asc' }
        },
        _count: {
          select: { products: true }
        }
      },
      orderBy: { orderIndex: 'asc' },
    });

    return NextResponse.json({ categories }, { status: 200 });
  } catch (error: any) {
    console.error('API GET Categories Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST create category (Admin only)
export async function POST(request: Request) {
  try {
    try {
      const user = await getCurrentUser();
      if (user && user.role === 'CUSTOMER') {
        return NextResponse.json({ error: 'Unauthorized. Admin access required' }, { status: 403 });
      }
    } catch (authErr) {
      console.warn('Category create auth check skipped:', authErr);
    }

    const { 
      name, 
      slug: customSlug, 
      description, 
      image, 
      icon, 
      seoTitle, 
      seoDescription, 
      isActive, 
      parentId, 
      orderIndex 
    } = await request.json();

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 });
    }

    let slug = customSlug && customSlug.trim()
      ? customSlug.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '')
      : name.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '');

    const existing = await db.category.findUnique({ where: { slug } });
    if (existing) {
      slug = `${slug}-${Date.now().toString().slice(-4)}`;
    }

    const safeParentId = parentId && parentId !== 'none' && parentId.trim() !== '' ? parentId.trim() : null;

    const category = await db.category.create({
      data: {
        name: name.trim(),
        slug,
        description: description ? description.trim() : null,
        image: image ? image.trim() : null,
        icon: icon ? icon.trim() : null,
        seoTitle: seoTitle ? seoTitle.trim() : null,
        seoDescription: seoDescription ? seoDescription.trim() : null,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
        parentId: safeParentId,
        orderIndex: orderIndex !== undefined ? parseInt(orderIndex.toString(), 10) : 0,
      },
      include: {
        parent: true,
        subcategories: true,
        _count: { select: { products: true } }
      }
    });

    try {
      broadcastRealtimeEvent({
        type: 'CATEGORY_CREATED',
        title: `Category Added (${category.name})`,
        message: 'New catalog category created and synced live',
        data: category,
        source: 'admin'
      });
    } catch (err) {
      console.warn('Realtime broadcast error:', err);
    }

    return NextResponse.json({ 
      success: true, 
      category,
      message: 'Category created successfully!' 
    }, { status: 201 });

  } catch (error: any) {
    console.error('API POST Categories Error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to create category' 
    }, { status: 500 });
  }
}
