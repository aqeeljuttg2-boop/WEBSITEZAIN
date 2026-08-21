import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ user: null }, { status: 200 }); // Return null user, not error, to make front-end loading easier
    }
    return NextResponse.json({ user }, { status: 200 });
  } catch (error: any) {
    console.error('API /auth/me Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
