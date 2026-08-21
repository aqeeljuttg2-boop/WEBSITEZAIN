import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, phone, whatsapp, company, address, city, zipCode, country } = await request.json();

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const updated = await db.user.update({
      where: { id: user.id },
      data: {
        name,
        phone: phone || null,
        whatsapp: whatsapp || null,
        company: company || null,
        address: address || null,
        city: city || null,
        zipCode: zipCode || null,
        country: country || null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        whatsapp: true,
        company: true,
        country: true,
        address: true,
        city: true,
        zipCode: true,
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      user: updated
    }, { status: 200 });

  } catch (error: any) {
    console.error('API PUT User Profile Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
