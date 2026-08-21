import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { parseCSV } from '@/lib/csv';

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== 'SUPERADMIN' && user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized. Admin access required' }, { status: 403 });
    }

    const { csvText } = await request.json();

    if (!csvText) {
      return NextResponse.json({ error: 'No CSV data provided' }, { status: 400 });
    }

    const records = parseCSV(csvText);

    if (records.length === 0) {
      return NextResponse.json({ error: 'CSV file is empty or invalid format' }, { status: 400 });
    }

    let createdCount = 0;
    let updatedCount = 0;

    for (const record of records) {
      const name = record['Product Name'] || record['name'];
      const productCode = record['Product Code'] || record['productCode'] || record['code'];
      const sku = record['SKU'] || record['sku'];
      const categoryName = record['Category'] || record['category'];
      const subcategoryName = record['Subcategory'] || record['subcategory'];
      const description = record['Description'] || record['description'];
      const material = record['Material'] || record['material'];
      const size = record['Size'] || record['size'];
      const priceVal = parseFloat(record['Price'] || record['price'] || '0');
      const moqVal = parseInt(record['MOQ'] || record['moq'] || '1', 10);
      const stockVal = parseInt(record['Stock'] || record['stock'] || '0', 10);
      const imageUrls = record['Image URLs'] || record['imageUrls'] || record['images'] || '';
      const tags = record['Tags'] || record['tags'] || '';

      // Skip invalid rows
      if (!name || !productCode || !sku) continue;

      // Handle Category find/create
      let targetCategoryId: string | null = null;
      if (categoryName) {
        // Find or create main category
        const parentSlug = categoryName.toLowerCase().trim().replace(/[\s_-]+/g, '-');
        let parentCat = await db.category.findFirst({
          where: {
            OR: [
              { name: categoryName },
              { slug: parentSlug }
            ]
          }
        });

        if (!parentCat) {
          parentCat = await db.category.create({
            data: {
              name: categoryName,
              slug: parentSlug + '-' + Math.floor(Math.random() * 1000), // Append random to prevent collision
              description: `Imported via CSV`,
            }
          });
        }

        targetCategoryId = parentCat.id;

        // Find or create subcategory if specified
        if (subcategoryName) {
          const subSlug = subcategoryName.toLowerCase().trim().replace(/[\s_-]+/g, '-');
          let subCat = await db.category.findFirst({
            where: {
              parentId: parentCat.id,
              OR: [
                { name: subcategoryName },
                { slug: subSlug }
              ]
            }
          });

          if (!subCat) {
            subCat = await db.category.create({
              data: {
                name: subcategoryName,
                slug: `${parentSlug}-${subSlug}-${Math.floor(Math.random() * 1000)}`,
                parentId: parentCat.id,
                description: `Subcategory of ${categoryName}`,
              }
            });
          }
          targetCategoryId = subCat.id;
        }
      }

      // Generate product slug
      const productSlug = `${name.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '')}-${productCode.toLowerCase()}`;

      // Check if product exists by productCode or SKU
      const existingProduct = await db.product.findFirst({
        where: {
          OR: [
            { productCode },
            { sku }
          ]
        }
      });

      if (existingProduct) {
        // Update product
        await db.product.update({
          where: { id: existingProduct.id },
          data: {
            name,
            slug: productSlug,
            productCode,
            sku,
            categoryId: targetCategoryId || existingProduct.categoryId,
            description: description || existingProduct.description,
            material: material || existingProduct.material,
            size: size || existingProduct.size,
            singlePrice: priceVal || existingProduct.singlePrice,
            moq: moqVal || existingProduct.moq,
            stock: stockVal !== undefined ? stockVal : existingProduct.stock,
            images: imageUrls || existingProduct.images,
            seoKeywords: tags || existingProduct.seoKeywords,
          }
        });
        updatedCount++;
      } else {
        // Create product
        await db.product.create({
          data: {
            name,
            slug: productSlug,
            productCode,
            sku,
            categoryId: targetCategoryId,
            description: description || '',
            material: material || '',
            size: size || '',
            singlePrice: priceVal,
            moq: moqVal,
            stock: stockVal,
            images: imageUrls,
            seoKeywords: tags,
            status: 'ACTIVE',
          }
        });
        createdCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `CSV Import completed successfully`,
      createdCount,
      updatedCount,
      totalProcessed: createdCount + updatedCount,
    }, { status: 200 });

  } catch (error: any) {
    console.error('API POST Import Products Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
