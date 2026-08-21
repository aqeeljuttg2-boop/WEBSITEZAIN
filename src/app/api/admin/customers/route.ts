import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET list of customers with search, pagination, and total spend calculation
export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== 'SUPERADMIN' && user.role !== 'ADMIN' && user.role !== 'STAFF')) {
      return NextResponse.json({ error: 'Unauthorized. Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const skip = (page - 1) * limit;

    const where: any = { role: 'CUSTOMER' };
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
        { company: { contains: search } },
        { city: { contains: search } },
        { country: { contains: search } }
      ];
    }

    const [customers, total] = await Promise.all([
      db.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          whatsapp: true,
          company: true,
          country: true,
          address: true,
          city: true,
          zipCode: true,
          createdAt: true,
          updatedAt: true,
          orders: {
            select: {
              id: true,
              orderNumber: true,
              total: true,
              status: true,
              paymentStatus: true,
              createdAt: true
            }
          },
          _count: {
            select: { orders: true, rfqs: true, reviews: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      db.user.count({ where })
    ]);

    const formatted = customers.map(c => {
      const totalSpent = c.orders
        .filter(o => o.paymentStatus === 'PAID' || o.status === 'DELIVERED')
        .reduce((sum, o) => sum + o.total, 0);

      return {
        ...c,
        totalSpent,
        totalOrders: c._count.orders,
        totalRFQs: c._count.rfqs,
      };
    });

    return NextResponse.json({
      customers: formatted,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: page,
        limit
      }
    }, { status: 200 });
  } catch (error: any) {
    console.error('API GET Customers Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
