import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

// PUT update media alt text
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
      console.warn('Media update auth check skipped:', authErr);
    }

    const { altText, fileName } = await request.json();

    const updated = await db.media.update({
      where: { id },
      data: {
        altText: altText !== undefined ? altText : undefined,
        fileName: fileName !== undefined ? fileName : undefined
      }
    });

    return NextResponse.json({ success: true, media: updated }, { status: 200 });
  } catch (error: any) {
    console.error('API PUT Media Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update media' }, { status: 500 });
  }
}

// DELETE media item
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
      console.warn('Media delete auth check skipped:', authErr);
    }

    const media = await db.media.findUnique({ where: { id } });
    if (!media) return NextResponse.json({ error: 'Media not found' }, { status: 404 });

    // Try deleting from public disk if local file
    if (media.fileUrl.startsWith('/products/') || media.fileUrl.startsWith('/catagori/')) {
      try {
        const filePath = path.join(process.cwd(), 'public', media.fileUrl.replace(/^\//, ''));
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (fileErr) {
        console.warn('Could not delete physical file:', fileErr);
      }
    }

    await db.media.delete({ where: { id } });
    return NextResponse.json({ success: true, message: 'Media deleted successfully' }, { status: 200 });
  } catch (error: any) {
    console.error('API DELETE Media Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete media' }, { status: 500 });
  }
}
