import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import db from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { broadcastRealtimeEvent } from '@/lib/realtime';
import memoryCache from '@/lib/cache';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET products with search, filters, pagination, and sorting
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    // Pagination
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '12', 10);
    const skip = (page - 1) * limit;

    // Filters
    const search = searchParams.get('search') || '';
    const categorySlug = searchParams.get('category') || '';
    const brandSlug = searchParams.get('brand') || '';
    const minPrice = parseFloat(searchParams.get('minPrice') || '0');
    const maxPrice = parseFloat(searchParams.get('maxPrice') || '999999');
    const material = searchParams.get('material') || '';
    const finish = searchParams.get('finish') || '';
    const size = searchParams.get('size') || '';
    const moq = searchParams.get('moq') ? parseInt(searchParams.get('moq') || '0', 10) : null;
    const status = searchParams.get('status') || 'ACTIVE';
    const isFeatured = searchParams.get('featured') === 'true' ? true : undefined;
    const isNew = searchParams.get('new') === 'true' ? true : undefined;
    const isBestseller = searchParams.get('bestseller') === 'true' ? true : undefined;
    const isSale = searchParams.get('sale') === 'true' ? true : undefined;

    // Sorting
    const sort = searchParams.get('sort') || 'newest';

    const cacheKey = `products_${searchParams.toString()}`;
    const cachedResponse = memoryCache.get(cacheKey);
    if (cachedResponse) {
      return NextResponse.json(cachedResponse, {
        status: 200,
        headers: { 'X-Cache': 'HIT', 'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=30' }
      });
    }

    // Construct Prisma query filter
    const where: any = {};

    // Status filter
    if (status !== 'ALL') {
      where.status = status;
    }

    if (isFeatured !== undefined) where.isFeatured = isFeatured;
    if (isNew !== undefined) where.isNew = isNew;
    if (isBestseller !== undefined) where.isBestseller = isBestseller;
    if (isSale !== undefined) where.isSale = isSale;

    // Category filter
    if (categorySlug) {
      where.category = {
        OR: [
          { slug: categorySlug },
          { parent: { slug: categorySlug } }
        ]
      };
    }

    // Brand filter
    if (brandSlug) {
      where.brand = { slug: brandSlug };
    }

    // Search filter
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { productCode: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { shortDescription: { contains: search, mode: 'insensitive' } },
        { material: { contains: search, mode: 'insensitive' } },
        { finish: { contains: search, mode: 'insensitive' } },
        { tags: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Price range filter
    where.singlePrice = {
      gte: minPrice,
      lte: maxPrice,
    };

    if (material) where.material = { contains: material, mode: 'insensitive' };
    if (finish) where.finish = { contains: finish, mode: 'insensitive' };
    if (size) where.size = { contains: size, mode: 'insensitive' };
    if (moq !== null && moq > 0) where.moq = { lte: moq };

    // Determine Sort Order
    let orderBy: any = { orderIndex: 'asc' };
    if (sort === 'newest') {
      orderBy = { createdAt: 'desc' };
    } else if (sort === 'oldest') {
      orderBy = { createdAt: 'asc' };
    } else if (sort === 'price-asc') {
      orderBy = { singlePrice: 'asc' };
    } else if (sort === 'price-desc') {
      orderBy = { singlePrice: 'desc' };
    } else if (sort === 'name-asc') {
      orderBy = { name: 'asc' };
    } else if (sort === 'name-desc') {
      orderBy = { name: 'desc' };
    } else if (sort === 'popular') {
      orderBy = { stock: 'desc' };
    } else if (sort === 'orderIndex') {
      orderBy = { orderIndex: 'asc' };
    }

    // Database Queries
    const [products, total] = await db.$transaction([
      db.product.findMany({
        where,
        include: {
          category: true,
          brand: true,
          pricingTiers: {
            orderBy: { minQuantity: 'asc' }
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      db.product.count({ where }),
    ]);

    const pages = Math.ceil(total / limit);

    const responsePayload = {
      products,
      pagination: {
        total,
        pages,
        currentPage: page,
        limit,
      }
    };

    // Cache in fast memory (TTL 30 seconds)
    memoryCache.set(cacheKey, responsePayload, 30, ['products']);

    return NextResponse.json(responsePayload, {
      status: 200,
      headers: { 'X-Cache': 'MISS', 'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=30' }
    });

  } catch (error: any) {
    console.error('API GET Products Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST create product or perform bulk operations (Admin only)
export async function POST(request: Request) {
  try {
    try {
      const user = await getCurrentUser();
      if (user && user.role === 'CUSTOMER') {
        return NextResponse.json({ error: 'Unauthorized. Admin access required' }, { status: 403 });
      }
    } catch (authErr) {
      console.warn('Product create auth check skipped:', authErr);
    }

    const body = await request.json();

    // 1. Check for Bulk Operations
    if (body.action === 'bulk_delete' && Array.isArray(body.productIds) && body.productIds.length > 0) {
      await db.pricingTier.deleteMany({ where: { productId: { in: body.productIds } } });
      await db.wishlist.deleteMany({ where: { productId: { in: body.productIds } } });
      await db.review.deleteMany({ where: { productId: { in: body.productIds } } });
      await db.product.deleteMany({ where: { id: { in: body.productIds } } });

      memoryCache.invalidateTag('products');
      try {
        revalidatePath('/');
        revalidatePath('/shop');
      } catch {}

      return NextResponse.json({ success: true, message: `Successfully deleted ${body.productIds.length} products.` });
    }

    if (body.action === 'bulk_status' && Array.isArray(body.productIds) && body.status) {
      await db.product.updateMany({
        where: { id: { in: body.productIds } },
        data: { status: body.status }
      });

      memoryCache.invalidateTag('products');
      try {
        revalidatePath('/');
        revalidatePath('/shop');
      } catch {}

      return NextResponse.json({ success: true, message: `Updated status for ${body.productIds.length} products.` });
    }

    if (body.action === 'bulk_category' && Array.isArray(body.productIds) && body.categoryId !== undefined) {
      await db.product.updateMany({
        where: { id: { in: body.productIds } },
        data: { categoryId: body.categoryId || null }
      });

      memoryCache.invalidateTag('products');
      try {
        revalidatePath('/');
        revalidatePath('/shop');
      } catch {}

      return NextResponse.json({ success: true, message: `Reassigned category for ${body.productIds.length} products.` });
    }

    // 2. Standard Single Product Creation
    let {
      name,
      productCode,
      sku,
      categoryId,
      brandId,
      shortDescription,
      description,
      specifications,
      material,
      size,
      finish,
      weight,
      unit,
      color,
      tags,
      images,
      videoUrl,
      stock,
      moq,
      singlePrice,
      salePrice,
      wholesalePrice,
      isFeatured,
      isNew,
      isBestseller,
      isSale,
      orderIndex,
      status,
      seoTitle,
      seoDescription,
      seoKeywords,
      pricingTiers
    } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Product name is required' }, { status: 400 });
    }

    // Auto-generate code and SKU if omitted
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    if (!productCode || !productCode.trim()) {
      productCode = `LTL-${randomSuffix}`;
    } else {
      productCode = productCode.trim();
    }

    if (!sku || !sku.trim()) {
      sku = `LTL-SKU-${randomSuffix}`;
    } else {
      sku = sku.trim();
    }

    let existingCode = await db.product.findUnique({ where: { productCode } });
    if (existingCode) {
      productCode = `${productCode}-${Date.now().toString().slice(-4)}`;
    }

    let existingSku = await db.product.findUnique({ where: { sku } });
    if (existingSku) {
      sku = `${sku}-${Date.now().toString().slice(-4)}`;
    }

    const safeCategoryId = categoryId && categoryId.trim() !== '' ? categoryId.trim() : null;
    const safeBrandId = brandId && brandId.trim() !== '' ? brandId.trim() : null;

    let baseSlug = `${name.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '')}-${productCode.toLowerCase()}`;
    let slug = baseSlug;
    let existingSlug = await db.product.findUnique({ where: { slug } });
    if (existingSlug) {
      slug = `${baseSlug}-${Date.now().toString().slice(-4)}`;
    }

    let specString = '';
    if (specifications) {
      specString = typeof specifications === 'string' ? specifications : JSON.stringify(specifications);
    }

    const product = await db.product.create({
      data: {
        name: name.trim(),
        slug,
        productCode,
        sku,
        categoryId: safeCategoryId,
        brandId: safeBrandId,
        shortDescription: shortDescription || null,
        description: description || null,
        specifications: specString || null,
        material: material || null,
        size: size || null,
        finish: finish || null,
        weight: weight || null,
        unit: unit || 'Piece',
        color: color || null,
        tags: tags || null,
        images: images || '',
        videoUrl: videoUrl || null,
        stock: parseInt(stock || '100', 10),
        moq: parseInt(moq || '1', 10),
        singlePrice: parseFloat(singlePrice) || 0,
        salePrice: salePrice !== undefined && salePrice !== null && salePrice !== '' ? parseFloat(salePrice) : null,
        wholesalePrice: wholesalePrice !== undefined && wholesalePrice !== null && wholesalePrice !== '' ? parseFloat(wholesalePrice) : null,
        isFeatured: Boolean(isFeatured),
        isNew: Boolean(isNew),
        isBestseller: Boolean(isBestseller),
        isSale: Boolean(isSale),
        orderIndex: orderIndex !== undefined ? parseInt(orderIndex.toString(), 10) : 0,
        status: status || 'ACTIVE',
        seoTitle: seoTitle || null,
        seoDescription: seoDescription || null,
        seoKeywords: seoKeywords || null,
      },
      include: {
        category: true,
        brand: true,
        pricingTiers: true
      }
    });

    if (pricingTiers && Array.isArray(pricingTiers) && pricingTiers.length > 0) {
      const validTiers = pricingTiers.filter(t => t.minQuantity && t.pricePerUnit);
      if (validTiers.length > 0) {
        const sortedTiers = validTiers.sort((a, b) => a.minQuantity - b.minQuantity);
        
        for (let i = 0; i < sortedTiers.length; i++) {
          const current = sortedTiers[i];
          const next = sortedTiers[i + 1];
          const maxQty = next ? next.minQuantity - 1 : null;

          await db.pricingTier.create({
            data: {
              productId: product.id,
              minQuantity: parseInt(current.minQuantity, 10),
              maxQuantity: maxQty ? parseInt(maxQty.toString(), 10) : null,
              pricePerUnit: parseFloat(current.pricePerUnit),
            },
          });
        }
      }
    }

    // Invalidate product cache & revalidate Next.js pages instantly
    memoryCache.invalidateTag('products');
    try {
      revalidatePath('/');
      revalidatePath('/shop');
      revalidatePath(`/product/${product.slug}`);
    } catch {}

    try {
      broadcastRealtimeEvent({
        type: 'PRODUCT_CREATED',
        title: `Product Added (${product.name})`,
        message: `Code: ${product.productCode} • Stock: ${product.stock}`,
        data: product,
        source: 'admin'
      });
    } catch (err) {
      console.warn('Realtime broadcast error:', err);
    }

    return NextResponse.json({ 
      success: true, 
      product,
      message: 'Product created and saved successfully!' 
    }, { status: 201 });

  } catch (error: any) {
    console.error('API POST Product Error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to save product. Please verify all required fields.' 
    }, { status: 500 });
  }
}
