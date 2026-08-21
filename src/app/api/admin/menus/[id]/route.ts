import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET single menu item
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const item = await db.menuItem.findUnique({
      where: { id },
      include: { children: true, parent: true }
    });
    if (!item) return NextResponse.json({ error: 'Menu item not found' }, { status: 404 });
    return NextResponse.json({ menuItem: item }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PUT update menu item
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
      console.warn('Menu update auth check skipped:', authErr);
    }

    const existing = await db.menuItem.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Menu item not found' }, { status: 404 });

    const body = await request.json();
    const { title, url, menuType, parentId, orderIndex, target, badge, isEnabled } = body;

    let safeParentId = existing.parentId;
    if (parentId !== undefined) {
      safeParentId = parentId && parentId !== 'none' && parentId.trim() !== '' ? parentId.trim() : null;
    }

    const updated = await db.menuItem.update({
      where: { id },
      data: {
        title: title !== undefined ? title.trim() : existing.title,
        url: url !== undefined ? url.trim() : existing.url,
        menuType: menuType !== undefined ? menuType : existing.menuType,
        parentId: safeParentId,
        orderIndex: orderIndex !== undefined ? parseInt(orderIndex.toString(), 10) : existing.orderIndex,
        target: target !== undefined ? target : existing.target,
        badge: badge !== undefined ? badge : existing.badge,
        isEnabled: isEnabled !== undefined ? Boolean(isEnabled) : existing.isEnabled,
      }
    });

    return NextResponse.json({ success: true, menuItem: updated, message: 'Menu item updated!' }, { status: 200 });
  } catch (error: any) {
    console.error('API PUT Menu Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update menu item' }, { status: 500 });
  }
}

// DELETE menu item
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
      console.warn('Menu delete auth check skipped:', authErr);
    }

    await db.menuItem.delete({ where: { id } });
    return NextResponse.json({ success: true, message: 'Menu item deleted' }, { status: 200 });
  } catch (error: any) {
    console.error('API DELETE Menu Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete menu item' }, { status: 500 });
  }
}
