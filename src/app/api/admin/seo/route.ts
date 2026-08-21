import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET global SEO data and index summaries
export async function GET() {
  try {
    const seoKeys = [
      'seoTitle',
      'seoDescription',
      'seoKeywords',
      'ogImage',
      'faviconUrl',
      'robotsIndex',
      'googleSiteVerification',
      'facebookPixelId',
      'googleAnalyticsId',
      'twitterHandle'
    ];

    const settingsList = await db.setting.findMany({
      where: { key: { in: seoKeys } }
    });

    const seoSettings: Record<string, string> = {
      seoTitle: 'Lash Tweezers Lounge | Handcrafted Lash Tweezers & Shears',
      seoDescription: 'Premium export-quality eyelash extension tweezers, volume lash clamps, barber shears, cuticle nippers, and grooming kits.',
      seoKeywords: 'lash tweezers, eyelash extension tweezers, volume tweezers, barber shears, cuticle nippers, Sialkot manufacturer',
      ogImage: '/icon.png',
      faviconUrl: '/icon.png',
      robotsIndex: 'index, follow',
      googleSiteVerification: '',
      facebookPixelId: '',
      googleAnalyticsId: '',
      twitterHandle: '@lash_tweezers_lounge'
    };

    settingsList.forEach(s => {
      seoSettings[s.key] = s.value;
    });

    const [productCount, categoryCount, pageCount] = await Promise.all([
      db.product.count({ where: { status: 'ACTIVE' } }),
      db.category.count({ where: { isActive: true } }),
      db.page.count({ where: { isPublished: true } })
    ]);

    return NextResponse.json({
      seoSettings,
      stats: {
        indexedProducts: productCount,
        indexedCategories: categoryCount,
        indexedPages: pageCount
      }
    }, { status: 200 });
  } catch (error: any) {
    console.error('API GET SEO Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PUT update SEO settings
export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== 'SUPERADMIN' && user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized. Admin access required' }, { status: 403 });
    }

    const updates = await request.json();
    if (!updates || typeof updates !== 'object') {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const promises = Object.entries(updates).map(([key, val]) => {
      const valStr = typeof val === 'string' ? val : JSON.stringify(val);
      return db.setting.upsert({
        where: { key },
        update: { value: valStr },
        create: { key, value: valStr, description: 'SEO Setting' }
      });
    });

    await db.$transaction(promises);

    return NextResponse.json({ success: true, message: 'SEO settings updated successfully!' }, { status: 200 });
  } catch (error: any) {
    console.error('API PUT SEO Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update SEO' }, { status: 500 });
  }
}
