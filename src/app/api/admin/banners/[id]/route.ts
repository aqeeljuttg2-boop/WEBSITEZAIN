import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET single banner
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const banner = await db.banner.findUnique({ where: { id } });
    if (!banner) return NextResponse.json({ error: 'Banner not found' }, { status: 404 });
    return NextResponse.json({ banner }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PUT update banner
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
      console.warn('Banner update auth check skipped:', authErr);
    }

    const existing = await db.banner.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Banner not found' }, { status: 404 });

    const body = await request.json();
    const {
      title,
      subtitle,
      badge,
      buttonText,
      buttonUrl,
      secondaryButtonText,
      secondaryButtonUrl,
      desktopImage,
      mobileImage,
      position,
      startDate,
      endDate,
      isActive,
      orderIndex
    } = body;

    const updated = await db.banner.update({
      where: { id },
      data: {
        title: title !== undefined ? title.trim() : existing.title,
        subtitle: subtitle !== undefined ? subtitle : existing.subtitle,
        badge: badge !== undefined ? badge : existing.badge,
        buttonText: buttonText !== undefined ? buttonText : existing.buttonText,
        buttonUrl: buttonUrl !== undefined ? buttonUrl : existing.buttonUrl,
        secondaryButtonText: secondaryButtonText !== undefined ? secondaryButtonText : existing.secondaryButtonText,
        secondaryButtonUrl: secondaryButtonUrl !== undefined ? secondaryButtonUrl : existing.secondaryButtonUrl,
        desktopImage: desktopImage !== undefined ? desktopImage : existing.desktopImage,
        mobileImage: mobileImage !== undefined ? mobileImage : existing.mobileImage,
        position: position !== undefined ? position : existing.position,
        startDate: startDate !== undefined ? (startDate ? new Date(startDate) : null) : existing.startDate,
        endDate: endDate !== undefined ? (endDate ? new Date(endDate) : null) : existing.endDate,
        isActive: isActive !== undefined ? Boolean(isActive) : existing.isActive,
        orderIndex: orderIndex !== undefined ? parseInt(orderIndex.toString(), 10) : existing.orderIndex,
      }
    });

    return NextResponse.json({ success: true, banner: updated, message: 'Banner updated successfully!' }, { status: 200 });
  } catch (error: any) {
    console.error('API PUT Banner Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update banner' }, { status: 500 });
  }
}

// DELETE banner
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
      console.warn('Banner delete auth check skipped:', authErr);
    }

    await db.banner.delete({ where: { id } });
    return NextResponse.json({ success: true, message: 'Banner deleted successfully' }, { status: 200 });
  } catch (error: any) {
    console.error('API DELETE Banner Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete banner' }, { status: 500 });
  }
}
