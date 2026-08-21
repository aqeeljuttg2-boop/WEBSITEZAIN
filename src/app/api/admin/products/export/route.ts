import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { generateCSV } from '@/lib/csv';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== 'SUPERADMIN' && user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized. Admin access required' }, { status: 403 });
    }

    const products = await db.product.findMany({
      include: {
        category: {
          include: {
            parent: true
          }
        }
      },
      orderBy: { productCode: 'asc' }
    });

    const csvText = generateCSV(products);

    // Return as downloadable file attachment
    const response = new NextResponse(csvText, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="apex_catalog_export.csv"',
        'Pragma': 'no-cache',
        'Cache-Control': 'no-cache',
      },
    });

    return response;

  } catch (error: any) {
    console.error('API GET Export Products Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
