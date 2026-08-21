import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== 'SUPERADMIN' && user.role !== 'ADMIN' && user.role !== 'STAFF')) {
      return NextResponse.json({ error: 'Unauthorized. Admin access required' }, { status: 403 });
    }

    // 1. Core Counts
    const totalOrders = await db.order.count();
    const pendingOrders = await db.order.count({ where: { status: 'PENDING' } });
    const completedOrders = await db.order.count({ where: { status: 'DELIVERED' } });
    const processingOrders = await db.order.count({ where: { status: 'PROCESSING' } });
    const shippedOrders = await db.order.count({ where: { status: 'SHIPPED' } });

    const totalRFQs = await db.rfq.count();
    const newRFQs = await db.rfq.count({ where: { status: 'NEW' } });
    const quotedRFQs = await db.rfq.count({ where: { status: 'QUOTED' } });

    const totalCustomers = await db.user.count({ where: { role: 'CUSTOMER' } });
    const totalProducts = await db.product.count();
    const activeProducts = await db.product.count({ where: { status: 'ACTIVE' } });
    const lowStockProducts = await db.product.count({ where: { stock: { lte: 10, gt: 0 } } });
    const outOfStockProducts = await db.product.count({ where: { stock: { lte: 0 } } });

    const totalCategories = await db.category.count({ where: { parentId: null } });
    const totalSubcategories = await db.category.count({ where: { parentId: { not: null } } });
    const totalBrands = await db.brand.count();

    const totalReviews = await db.review.count();
    const pendingReviews = await db.review.count({ where: { isApproved: false } });

    // 2. Sum revenue
    const paidOrders = await db.order.findMany({
      where: {
        OR: [
          { paymentStatus: 'PAID' },
          { status: 'DELIVERED' }
        ]
      },
      select: { total: true }
    });
    const revenue = paidOrders.reduce((sum, order) => sum + order.total, 0);

    // 3. Top products
    const orderItems = await db.orderItem.findMany({
      select: {
        productCode: true,
        productName: true,
        quantity: true,
        totalPrice: true
      }
    });

    const productMap: Record<string, { name: string, qty: number, revenue: number }> = {};
    orderItems.forEach(item => {
      if (!productMap[item.productCode]) {
        productMap[item.productCode] = { name: item.productName, qty: 0, revenue: 0 };
      }
      productMap[item.productCode].qty += item.quantity;
      productMap[item.productCode].revenue += item.totalPrice;
    });

    const topProducts = Object.entries(productMap)
      .map(([code, data]) => ({ code, ...data }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);

    // 4. Category distribution
    const categories = await db.category.findMany({
      where: { parentId: null },
      include: {
        _count: {
          select: { products: true }
        },
        subcategories: {
          include: {
            _count: {
              select: { products: true }
            }
          }
        }
      }
    });

    const topCategories = categories.map(cat => {
      let count = cat._count.products;
      cat.subcategories.forEach(sub => {
        count += sub._count.products;
      });
      return {
        id: cat.id,
        name: cat.name,
        count
      };
    }).sort((a, b) => b.count - a.count);

    // 5. Recent orders
    const recentOrders = await db.order.findMany({
      take: 6,
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          take: 2
        }
      }
    });

    // 6. Recent RFQs
    const recentRFQs = await db.rfq.findMany({
      take: 6,
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          take: 2
        }
      }
    });

    // 7. Recent Products
    const recentProducts = await db.product.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        category: true
      }
    });

    // 8. Recent Customers
    const recentCustomers = await db.user.findMany({
      where: { role: 'CUSTOMER' },
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        company: true,
        country: true,
        createdAt: true,
        _count: {
          select: { orders: true, rfqs: true }
        }
      }
    });

    // 9. Monthly Sales Chart
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);

    const ordersHistory = await db.order.findMany({
      where: {
        createdAt: { gte: sixMonthsAgo }
      },
      select: {
        total: true,
        createdAt: true
      }
    });

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlySalesMap: Record<string, number> = {};

    for (let i = 0; i < 6; i++) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const label = `${months[d.getMonth()]} ${d.getFullYear().toString().slice(-2)}`;
      monthlySalesMap[label] = 0;
    }

    ordersHistory.forEach(order => {
      const d = new Date(order.createdAt);
      const label = `${months[d.getMonth()]} ${d.getFullYear().toString().slice(-2)}`;
      if (monthlySalesMap[label] !== undefined) {
        monthlySalesMap[label] += order.total;
      }
    });

    const monthlySales = Object.entries(monthlySalesMap)
      .map(([name, value]) => ({ name, value }))
      .reverse();

    return NextResponse.json({
      summary: {
        revenue,
        totalOrders,
        pendingOrders,
        completedOrders,
        processingOrders,
        shippedOrders,
        totalRFQs,
        newRFQs,
        quotedRFQs,
        totalCustomers,
        totalProducts,
        activeProducts,
        lowStockProducts,
        outOfStockProducts,
        totalCategories,
        totalSubcategories,
        totalBrands,
        totalReviews,
        pendingReviews,
        conversionRate: totalRFQs > 0 ? ((totalOrders / (totalOrders + totalRFQs)) * 100).toFixed(1) : '0.0'
      },
      topProducts,
      topCategories,
      recentOrders,
      recentRFQs,
      recentProducts,
      recentCustomers,
      monthlySales
    }, { status: 200 });

  } catch (error: any) {
    console.error('API GET Analytics Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
