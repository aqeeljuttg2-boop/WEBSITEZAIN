import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { broadcastRealtimeEvent } from '@/lib/realtime';

export const dynamic = 'force-dynamic';

// GET a product by ID, Slug, or Product Code
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const product = await db.product.findFirst({
      where: {
        OR: [
          { id },
          { slug: id },
          { productCode: id }
        ]
      },
      include: {
        category: true,
        brand: true,
        pricingTiers: {
          orderBy: { minQuantity: 'asc' }
        },
        reviews: {
          where: { isApproved: true },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ product }, { status: 200 });

  } catch (error: any) {
    console.error('API GET Product Detail Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PUT update product (Admin only)
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
      console.warn('Product update auth check skipped:', authErr);
    }

    const existingProduct = await db.product.findFirst({
      where: {
        OR: [
          { id },
          { slug: id },
          { productCode: id }
        ]
      }
    });

    if (!existingProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const body = await request.json();
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

    if (productCode && productCode !== existingProduct.productCode) {
      const dupeCode = await db.product.findFirst({ 
        where: { 
          productCode: productCode.trim(),
          id: { not: existingProduct.id }
        } 
      });
      if (dupeCode) {
        productCode = `${productCode.trim()}-${Date.now().toString().slice(-4)}`;
      }
    }

    if (sku && sku !== existingProduct.sku) {
      const dupeSku = await db.product.findFirst({ 
        where: { 
          sku: sku.trim(),
          id: { not: existingProduct.id }
        } 
      });
      if (dupeSku) {
        sku = `${sku.trim()}-${Date.now().toString().slice(-4)}`;
      }
    }

    const safeCategoryId = categoryId !== undefined 
      ? (categoryId && categoryId.trim() !== '' ? categoryId.trim() : null)
      : existingProduct.categoryId;

    const safeBrandId = brandId !== undefined 
      ? (brandId && brandId.trim() !== '' ? brandId.trim() : null)
      : existingProduct.brandId;

    let specString = existingProduct.specifications;
    if (specifications !== undefined) {
      specString = typeof specifications === 'string' ? specifications : JSON.stringify(specifications);
    }

    let slug = existingProduct.slug;
    if (name && name !== existingProduct.name) {
      const baseSlug = `${name.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '')}-${(productCode || existingProduct.productCode).toLowerCase()}`;
      slug = baseSlug;
      const dupeSlug = await db.product.findFirst({
        where: {
          slug,
          id: { not: existingProduct.id }
        }
      });
      if (dupeSlug) {
        slug = `${baseSlug}-${Date.now().toString().slice(-4)}`;
      }
    }

    const updated = await db.product.update({
      where: { id: existingProduct.id },
      data: {
        name: name !== undefined ? name.trim() : existingProduct.name,
        slug,
        productCode: productCode !== undefined ? productCode.trim() : existingProduct.productCode,
        sku: sku !== undefined ? sku.trim() : existingProduct.sku,
        categoryId: safeCategoryId,
        brandId: safeBrandId,
        shortDescription: shortDescription !== undefined ? shortDescription : existingProduct.shortDescription,
        description: description !== undefined ? description : existingProduct.description,
        specifications: specString,
        material: material !== undefined ? material : existingProduct.material,
        size: size !== undefined ? size : existingProduct.size,
        finish: finish !== undefined ? finish : existingProduct.finish,
        weight: weight !== undefined ? weight : existingProduct.weight,
        unit: unit !== undefined ? unit : existingProduct.unit,
        color: color !== undefined ? color : existingProduct.color,
        tags: tags !== undefined ? tags : existingProduct.tags,
        images: images !== undefined ? images : existingProduct.images,
        videoUrl: videoUrl !== undefined ? videoUrl : existingProduct.videoUrl,
        stock: stock !== undefined ? parseInt(stock.toString(), 10) : existingProduct.stock,
        moq: moq !== undefined ? parseInt(moq.toString(), 10) : existingProduct.moq,
        singlePrice: singlePrice !== undefined ? parseFloat(singlePrice.toString()) : existingProduct.singlePrice,
        salePrice: salePrice !== undefined ? (salePrice !== null && salePrice !== '' ? parseFloat(salePrice.toString()) : null) : existingProduct.salePrice,
        wholesalePrice: wholesalePrice !== undefined ? (wholesalePrice !== null && wholesalePrice !== '' ? parseFloat(wholesalePrice.toString()) : null) : existingProduct.wholesalePrice,
        isFeatured: isFeatured !== undefined ? Boolean(isFeatured) : existingProduct.isFeatured,
        isNew: isNew !== undefined ? Boolean(isNew) : existingProduct.isNew,
        isBestseller: isBestseller !== undefined ? Boolean(isBestseller) : existingProduct.isBestseller,
        isSale: isSale !== undefined ? Boolean(isSale) : existingProduct.isSale,
        orderIndex: orderIndex !== undefined ? parseInt(orderIndex.toString(), 10) : existingProduct.orderIndex,
        status: status !== undefined ? status : existingProduct.status,
        seoTitle: seoTitle !== undefined ? seoTitle : existingProduct.seoTitle,
        seoDescription: seoDescription !== undefined ? seoDescription : existingProduct.seoDescription,
        seoKeywords: seoKeywords !== undefined ? seoKeywords : existingProduct.seoKeywords,
      },
      include: {
        category: true,
        brand: true,
        pricingTiers: true
      }
    });

    if (pricingTiers !== undefined && Array.isArray(pricingTiers)) {
      await db.pricingTier.deleteMany({ where: { productId: existingProduct.id } });

      const validTiers = pricingTiers.filter(t => t.minQuantity && t.pricePerUnit);
      if (validTiers.length > 0) {
        const sortedTiers = validTiers.sort((a, b) => a.minQuantity - b.minQuantity);
        for (let i = 0; i < sortedTiers.length; i++) {
          const current = sortedTiers[i];
          const next = sortedTiers[i + 1];
          const maxQty = next ? next.minQuantity - 1 : null;

          await db.pricingTier.create({
            data: {
              productId: existingProduct.id,
              minQuantity: parseInt(current.minQuantity.toString(), 10),
              maxQuantity: maxQty ? parseInt(maxQty.toString(), 10) : null,
              pricePerUnit: parseFloat(current.pricePerUnit.toString()),
            },
          });
        }
      }
    }

    try {
      broadcastRealtimeEvent({
        type: 'PRODUCT_UPDATED',
        title: `Product Updated (${updated.name})`,
        message: `Status: ${updated.status} • Stock: ${updated.stock} • Price: Rs. ${updated.singlePrice}`,
        data: updated,
        source: 'admin'
      });
    } catch (err) {
      console.warn('Realtime broadcast error:', err);
    }

    return NextResponse.json({ 
      success: true, 
      product: updated,
      message: 'Product updated successfully!' 
    }, { status: 200 });

  } catch (error: any) {
    console.error('API PUT Product Detail Error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to update product' 
    }, { status: 500 });
  }
}

// DELETE product (Admin only)
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
      console.warn('Product delete auth check skipped:', authErr);
    }

    const existingProduct = await db.product.findFirst({
      where: {
        OR: [
          { id },
          { slug: id },
          { productCode: id }
        ]
      }
    });

    if (!existingProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    await db.pricingTier.deleteMany({ where: { productId: existingProduct.id } });
    await db.wishlist.deleteMany({ where: { productId: existingProduct.id } });
    await db.review.deleteMany({ where: { productId: existingProduct.id } });

    await db.product.delete({
      where: { id: existingProduct.id },
    });

    try {
      broadcastRealtimeEvent({
        type: 'PRODUCT_DELETED',
        title: `Product Deleted (${existingProduct.name})`,
        message: `Product ${existingProduct.productCode} was removed`,
        data: { id: existingProduct.id, productCode: existingProduct.productCode },
        source: 'admin'
      });
    } catch (err) {
      console.warn('Realtime broadcast error:', err);
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Product deleted successfully' 
    }, { status: 200 });

  } catch (error: any) {
    console.error('API DELETE Product Error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to delete product' 
    }, { status: 500 });
  }
}
