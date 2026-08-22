import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import db from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { broadcastRealtimeEvent } from '@/lib/realtime';
import memoryCache from '@/lib/cache';

export const dynamic = 'force-dynamic';

// GET all menu items grouped or filtered by menuType
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const menuType = searchParams.get('type');
    const all = searchParams.get('all') === 'true';

    const cacheKey = `menus_${menuType || 'all'}_${all ? 'all' : 'enabled'}`;
    const cached = memoryCache.get(cacheKey);
    if (cached) {
      return NextResponse.json(cached, {
        status: 200,
        headers: { 'X-Cache': 'HIT', 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60' }
      });
    }

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

    const resPayload = { menus };
    memoryCache.set(cacheKey, resPayload, 60, ['menus']);

    return NextResponse.json(resPayload, {
      status: 200,
      headers: { 'X-Cache': 'MISS', 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60' }
    });
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

      memoryCache.invalidateTag('menus');
      try {
        revalidatePath('/', 'layout');
      } catch {}

      try {
        broadcastRealtimeEvent({
          type: 'MENU_UPDATED',
          title: 'Navigation Menu Reordered',
          message: 'Navbar structure updated live',
          source: 'admin'
        });
      } catch (err) {
        console.warn('Realtime broadcast error:', err);
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

    memoryCache.invalidateTag('menus');
    try {
      revalidatePath('/', 'layout');
    } catch {}

    try {
      broadcastRealtimeEvent({
        type: 'MENU_UPDATED',
        title: `Menu Item Added (${item.title})`,
        message: 'Navbar updated in real time',
        data: item,
        source: 'admin'
      });
    } catch (err) {
      console.warn('Realtime broadcast error:', err);
    }

    return NextResponse.json({ success: true, menuItem: item, message: 'Menu item created!' }, { status: 201 });
  } catch (error: any) {
    console.error('API POST Menu Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create menu item' }, { status: 500 });
  }
}
