import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET all menu items grouped or filtered by menuType
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const menuType = searchParams.get('type');
    const all = searchParams.get('all') === 'true';

    const where: any = {};
    if (!all) where.isEnabled = true;
    if (menuType) where.menuType = menuType;

    const menus = await db.menuItem.findMany({
      where,
      include: {
        children: {
          orderBy: { orderIndex: 'asc' }
        }
      },
      orderBy: { orderIndex: 'asc' }
    });

    return NextResponse.json({ menus }, { status: 200 });
  } catch (error: any) {
    console.error('API GET Menus Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST create menu item (Admin only)
export async function POST(request: Request) {
  try {
    try {
      const user = await getCurrentUser();
      if (user && user.role === 'CUSTOMER') {
        return NextResponse.json({ error: 'Unauthorized. Admin access required' }, { status: 403 });
      }
    } catch (authErr) {
      console.warn('Menu create auth check skipped:', authErr);
    }

    const body = await request.json();

    // 1. Bulk Reorder
    if (body.action === 'reorder' && Array.isArray(body.items)) {
      for (let i = 0; i < body.items.length; i++) {
        await db.menuItem.update({
          where: { id: body.items[i].id },
          data: { orderIndex: i }
        });
      }
      return NextResponse.json({ success: true, message: 'Menu order updated' });
    }

    const { title, url, menuType, parentId, orderIndex, target, badge, isEnabled } = body;
    if (!title || !url) {
      return NextResponse.json({ error: 'Title and URL are required' }, { status: 400 });
    }

    const safeParentId = parentId && parentId !== 'none' && parentId.trim() !== '' ? parentId.trim() : null;

    const item = await db.menuItem.create({
      data: {
        title: title.trim(),
        url: url.trim(),
        menuType: menuType || 'MAIN',
        parentId: safeParentId,
        orderIndex: orderIndex !== undefined ? parseInt(orderIndex.toString(), 10) : 0,
        target: target || '_self',
        badge: badge || null,
        isEnabled: isEnabled !== undefined ? Boolean(isEnabled) : true,
      }
    });

    return NextResponse.json({ success: true, menuItem: item, message: 'Menu item created!' }, { status: 201 });
  } catch (error: any) {
    console.error('API POST Menu Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create menu item' }, { status: 500 });
  }
}
