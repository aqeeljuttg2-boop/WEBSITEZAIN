import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET list of media items with search & pagination
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '40', 10);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.OR = [
        { fileName: { contains: search } },
        { altText: { contains: search } },
        { fileUrl: { contains: search } }
      ];
    }

    const [media, total] = await Promise.all([
      db.media.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      db.media.count({ where })
    ]);

    return NextResponse.json({
      media,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: page,
        limit
      }
    }, { status: 200 });
  } catch (error: any) {
    console.error('API GET Media Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST create media record (usually triggered after upload)
export async function POST(request: Request) {
  try {
    try {
      const user = await getCurrentUser();
      if (user && user.role === 'CUSTOMER') {
        return NextResponse.json({ error: 'Unauthorized. Admin access required' }, { status: 403 });
      }
    } catch (authErr) {
      console.warn('Media create auth check skipped:', authErr);
    }

    const body = await request.json();
    const { fileName, fileUrl, fileType, fileSize, mimeType, altText } = body;

    if (!fileName || !fileUrl) {
      return NextResponse.json({ error: 'File name and URL are required' }, { status: 400 });
    }

    const media = await db.media.upsert({
      where: { fileUrl },
      update: {
        fileName,
        altText: altText || fileName,
        fileSize: fileSize || 0,
        mimeType: mimeType || 'image/jpeg'
      },
      create: {
        fileName,
        fileUrl,
        fileType: fileType || 'image',
        fileSize: fileSize || 0,
        mimeType: mimeType || 'image/jpeg',
        altText: altText || fileName
      }
    });

    return NextResponse.json({ success: true, media }, { status: 201 });
  } catch (error: any) {
    console.error('API POST Media Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to save media' }, { status: 500 });
  }
}
