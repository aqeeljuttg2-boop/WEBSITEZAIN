import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// GET all coupons (Admin only)
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== 'SUPERADMIN' && user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized. Admin access required' }, { status: 403 });
    }

    const coupons = await db.coupon.findMany({
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ coupons }, { status: 200 });
  } catch (error: any) {
    console.error('API GET Admin Coupons Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST create a coupon (Admin only)
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== 'SUPERADMIN' && user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized. Admin access required' }, { status: 403 });
    }

    const { code, discountType, value, minOrderValue, maxDiscountAmount, startDate, endDate, usageLimit, status } = await request.json();

    if (!code || !discountType || value === undefined) {
      return NextResponse.json({ error: 'Coupon code, discount type, and value are required' }, { status: 400 });
    }

    const upperCode = code.toUpperCase().trim();
    
    // Check if code exists
    const existing = await db.coupon.findUnique({ where: { code: upperCode } });
    if (existing) {
      return NextResponse.json({ error: 'A coupon with this code already exists' }, { status: 409 });
    }

    const coupon = await db.coupon.create({
      data: {
        code: upperCode,
        discountType,
        value: parseFloat(value),
        minOrderValue: minOrderValue ? parseFloat(minOrderValue) : 0,
        maxDiscountAmount: maxDiscountAmount ? parseFloat(maxDiscountAmount) : null,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        usageLimit: usageLimit ? parseInt(usageLimit, 10) : null,
        status: status || 'ACTIVE',
      }
    });

    return NextResponse.json({ success: true, coupon }, { status: 201 });

  } catch (error: any) {
    console.error('API POST Coupon Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PUT edit a coupon (Admin only)
export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== 'SUPERADMIN' && user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized. Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { id, code, discountType, value, minOrderValue, maxDiscountAmount, startDate, endDate, usageLimit, status } = body;

    if (!id) {
      return NextResponse.json({ error: 'Coupon ID is required' }, { status: 400 });
    }

    const existing = await db.coupon.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Coupon not found' }, { status: 404 });
    }

    const upperCode = code ? code.toUpperCase().trim() : existing.code;
    
    if (upperCode !== existing.code) {
      const dupe = await db.coupon.findUnique({ where: { code: upperCode } });
      if (dupe) {
        return NextResponse.json({ error: 'A coupon with this code already exists' }, { status: 409 });
      }
    }

    const updated = await db.coupon.update({
      where: { id },
      data: {
        code: upperCode,
        discountType: discountType || existing.discountType,
        value: value !== undefined ? parseFloat(value) : existing.value,
        minOrderValue: minOrderValue !== undefined ? parseFloat(minOrderValue) : existing.minOrderValue,
        maxDiscountAmount: maxDiscountAmount !== undefined ? (maxDiscountAmount ? parseFloat(maxDiscountAmount) : null) : existing.maxDiscountAmount,
        startDate: startDate !== undefined ? (startDate ? new Date(startDate) : null) : existing.startDate,
        endDate: endDate !== undefined ? (endDate ? new Date(endDate) : null) : existing.endDate,
        usageLimit: usageLimit !== undefined ? (usageLimit ? parseInt(usageLimit, 10) : null) : existing.usageLimit,
        status: status || existing.status,
      }
    });

    return NextResponse.json({ success: true, coupon: updated }, { status: 200 });

  } catch (error: any) {
    console.error('API PUT Coupon Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE a coupon (Admin only)
export async function DELETE(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== 'SUPERADMIN' && user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized. Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const couponId = searchParams.get('couponId');

    if (!couponId) {
      return NextResponse.json({ error: 'Coupon ID is required' }, { status: 400 });
    }

    await db.coupon.delete({ where: { id: couponId } });

    return NextResponse.json({ success: true, message: 'Coupon deleted successfully' }, { status: 200 });

  } catch (error: any) {
    console.error('API DELETE Coupon Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
