import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import db from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { broadcastRealtimeEvent } from '@/lib/realtime';
import memoryCache from '@/lib/cache';

// POST reorder categories
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== 'SUPERADMIN' && user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized. Admin access required' }, { status: 403 });
    }

    const { items } = await request.json();
    // items is array of { id: string, orderIndex: number }

    if (!Array.isArray(items)) {
      return NextResponse.json({ error: 'Items array required' }, { status: 400 });
    }

    // Update each category orderIndex in a transaction
    await db.$transaction(
      items.map(item =>
        db.category.update({
          where: { id: item.id },
          data: { orderIndex: item.orderIndex }
        })
      )
    );

    memoryCache.invalidateTag('categories');
    try {
      revalidatePath('/');
      revalidatePath('/shop');
    } catch {}

    try {
      broadcastRealtimeEvent({
        type: 'CATEGORY_REORDERED',
        title: 'Categories Reordered',
        message: 'Category hierarchy & order updated live across storefront',
        source: 'admin'
      });
    } catch (err) {
      console.warn('Realtime broadcast error:', err);
    }

    return NextResponse.json({ success: true, message: 'Categories reordered successfully' }, { status: 200 });

  } catch (error: any) {
    console.error('API Reorder Categories Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
