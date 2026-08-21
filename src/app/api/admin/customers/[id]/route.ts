import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET single customer with complete order history and inquiries
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== 'SUPERADMIN' && user.role !== 'ADMIN' && user.role !== 'STAFF')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;
    const customer = await db.user.findUnique({
      where: { id },
      include: {
        orders: {
          include: { items: true },
          orderBy: { createdAt: 'desc' }
        },
        rfqs: {
          include: { items: true },
          orderBy: { createdAt: 'desc' }
        },
        reviews: {
          include: { product: true },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!customer) return NextResponse.json({ error: 'Customer not found' }, { status: 404 });

    const totalSpent = customer.orders
      .filter(o => o.paymentStatus === 'PAID' || o.status === 'DELIVERED')
      .reduce((sum, o) => sum + o.total, 0);

    return NextResponse.json({ customer: { ...customer, totalSpent } }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PUT update customer info
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== 'SUPERADMIN' && user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, phone, whatsapp, company, address, city, country, zipCode, role } = body;

    const updated = await db.user.update({
      where: { id },
      data: {
        name: name !== undefined ? name : undefined,
        phone: phone !== undefined ? phone : undefined,
        whatsapp: whatsapp !== undefined ? whatsapp : undefined,
        company: company !== undefined ? company : undefined,
        address: address !== undefined ? address : undefined,
        city: city !== undefined ? city : undefined,
        country: country !== undefined ? country : undefined,
        zipCode: zipCode !== undefined ? zipCode : undefined,
        role: role !== undefined ? role : undefined,
      }
    });

    return NextResponse.json({ success: true, customer: updated }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update customer' }, { status: 500 });
  }
}
