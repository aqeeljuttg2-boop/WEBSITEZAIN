import { NextResponse } from 'next/server';
import { getEventsSince, getRecentEventHistory } from '@/lib/realtime';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const since = searchParams.get('since');
    const limit = searchParams.get('limit');

    let events;
    if (since) {
      const sinceTimestamp = parseInt(since, 10);
      events = getEventsSince(sinceTimestamp);
    } else {
      const limitNum = limit ? parseInt(limit, 10) : 30;
      events = getRecentEventHistory(limitNum);
    }

    return NextResponse.json({
      success: true,
      timestamp: Date.now(),
      events
    }, { status: 200 });
  } catch (error: any) {
    console.error('API GET Realtime Events Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
