import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { broadcastRealtimeEvent } from '@/lib/realtime';

export const dynamic = 'force-dynamic';

// GET all homepage sections & slider banners
export async function GET() {
  try {
    const [sections, heroSlides] = await Promise.all([
      db.homepageSection.findMany({
        orderBy: { orderIndex: 'asc' }
      }),
      db.banner.findMany({
        where: { position: 'HERO_SLIDER' },
        orderBy: { orderIndex: 'asc' }
      })
    ]);

    return NextResponse.json({ sections, heroSlides }, { status: 200 });
  } catch (error: any) {
    console.error('API GET Homepage Config Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PUT / POST update homepage sections, reorder, or update individual section
export async function PUT(request: Request) {
  try {
    try {
      const user = await getCurrentUser();
      if (user && user.role === 'CUSTOMER') {
        return NextResponse.json({ error: 'Unauthorized. Admin access required' }, { status: 403 });
      }
    } catch (authErr) {
      console.warn('Homepage update auth check skipped:', authErr);
    }

    const body = await request.json();

    // 1. Bulk Reorder Sections
    if (body.action === 'reorder_sections' && Array.isArray(body.sections)) {
      for (let i = 0; i < body.sections.length; i++) {
        const item = body.sections[i];
        await db.homepageSection.update({
          where: { id: item.id },
          data: { orderIndex: i }
        });
      }

      try {
        broadcastRealtimeEvent({
          type: 'HOMEPAGE_UPDATED',
          title: 'Homepage Sections Reordered',
          message: 'Homepage layout order updated in real-time',
          source: 'admin'
        });
      } catch (err) {
        console.warn('Realtime broadcast error:', err);
      }

      return NextResponse.json({ success: true, message: 'Homepage section order updated!' });
    }

    // 2. Toggle Section Enabled/Disabled
    if (body.action === 'toggle_section' && body.id) {
      const existing = await db.homepageSection.findUnique({ where: { id: body.id } });
      if (!existing) return NextResponse.json({ error: 'Section not found' }, { status: 404 });

      const updated = await db.homepageSection.update({
        where: { id: body.id },
        data: { isEnabled: !existing.isEnabled }
      });

      try {
        broadcastRealtimeEvent({
          type: 'HOMEPAGE_UPDATED',
          title: `Homepage Section ${updated.isEnabled ? 'Enabled' : 'Disabled'}`,
          message: `Section "${updated.title}" visibility toggled live`,
          data: updated,
          source: 'admin'
        });
      } catch (err) {
        console.warn('Realtime broadcast error:', err);
      }

      return NextResponse.json({ success: true, section: updated });
    }

    // 3. Update Specific Section Content
    if (body.id) {
      const { title, subtitle, badge, content, buttonText, buttonUrl, imageUrl, isEnabled, orderIndex, config } = body;
      const updated = await db.homepageSection.update({
        where: { id: body.id },
        data: {
          title: title !== undefined ? title : undefined,
          subtitle: subtitle !== undefined ? subtitle : undefined,
          badge: badge !== undefined ? badge : undefined,
          content: content !== undefined ? content : undefined,
          buttonText: buttonText !== undefined ? buttonText : undefined,
          buttonUrl: buttonUrl !== undefined ? buttonUrl : undefined,
          imageUrl: imageUrl !== undefined ? imageUrl : undefined,
          isEnabled: isEnabled !== undefined ? Boolean(isEnabled) : undefined,
          orderIndex: orderIndex !== undefined ? parseInt(orderIndex.toString(), 10) : undefined,
          config: config !== undefined ? (typeof config === 'string' ? config : JSON.stringify(config)) : undefined,
        }
      });

      try {
        broadcastRealtimeEvent({
          type: 'HOMEPAGE_UPDATED',
          title: `Homepage Section Updated (${updated.title})`,
          message: 'Content changes live synced to storefront',
          data: updated,
          source: 'admin'
        });
      } catch (err) {
        console.warn('Realtime broadcast error:', err);
      }

      return NextResponse.json({ success: true, section: updated, message: 'Section updated successfully!' });
    }

    // 4. Create New Section
    if (body.sectionKey && body.title) {
      const { sectionKey, title, subtitle, badge, content, buttonText, buttonUrl, imageUrl, isEnabled, orderIndex, config } = body;
      const created = await db.homepageSection.create({
        data: {
          sectionKey,
          title,
          subtitle: subtitle || null,
          badge: badge || null,
          content: content || null,
          buttonText: buttonText || null,
          buttonUrl: buttonUrl || null,
          imageUrl: imageUrl || null,
          isEnabled: isEnabled !== undefined ? Boolean(isEnabled) : true,
          orderIndex: orderIndex !== undefined ? parseInt(orderIndex.toString(), 10) : 99,
          config: config ? (typeof config === 'string' ? config : JSON.stringify(config)) : null,
        }
      });

      try {
        broadcastRealtimeEvent({
          type: 'HOMEPAGE_UPDATED',
          title: `New Section Added (${created.title})`,
          message: 'New homepage section published live',
          data: created,
          source: 'admin'
        });
      } catch (err) {
        console.warn('Realtime broadcast error:', err);
      }

      return NextResponse.json({ success: true, section: created, message: 'Section created!' });
    }

    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });

  } catch (error: any) {
    console.error('API PUT Homepage Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update homepage settings' }, { status: 500 });
  }
}
