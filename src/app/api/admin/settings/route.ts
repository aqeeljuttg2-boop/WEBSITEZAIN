import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { broadcastRealtimeEvent } from '@/lib/realtime';

// GET all settings (Public can fetch settings, but let's hide sensitive fields if any)
export async function GET() {
  try {
    const settingsList = await db.setting.findMany();
    // Convert array of [{key, value}] to an object { [key]: value } for easier frontend usage
    const settings: Record<string, string> = {};
    settingsList.forEach(s => {
      settings[s.key] = s.value;
    });

    return NextResponse.json({ settings }, { status: 200 });
  } catch (error: any) {
    console.error('API GET Settings Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PUT update multiple settings (Admin only)
export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== 'SUPERADMIN' && user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized. Admin access required' }, { status: 403 });
    }

    const updates = await request.json(); // expect object { [key]: value }

    if (!updates || typeof updates !== 'object') {
      return NextResponse.json({ error: 'Invalid updates format' }, { status: 400 });
    }

    // Process updates in transaction
    const updatePromises = Object.entries(updates).map(([key, value]) => {
      const valStr = typeof value === 'string' ? value : JSON.stringify(value);
      return db.setting.upsert({
        where: { key },
        update: { value: valStr },
        create: {
          key,
          value: valStr,
          description: `Updated by admin`
        }
      });
    });

    await db.$transaction(updatePromises);

    // Retrieve fresh settings
    const freshList = await db.setting.findMany();
    const settings: Record<string, string> = {};
    freshList.forEach(s => {
      settings[s.key] = s.value;
    });

    try {
      broadcastRealtimeEvent({
        type: 'SETTINGS_UPDATED',
        title: 'Store Settings Updated',
        message: 'Store configurations, contact info, and WhatsApp templates updated live',
        data: settings,
        source: 'admin'
      });
    } catch (err) {
      console.warn('Realtime broadcast error:', err);
    }

    return NextResponse.json({
      success: true,
      message: 'Settings updated successfully',
      settings
    }, { status: 200 });

  } catch (error: any) {
    console.error('API PUT Settings Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
