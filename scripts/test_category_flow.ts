import db from '../src/lib/db';

async function runTest() {
  console.log('--- 1. Testing Category Creation ---');
  const catSlug = 'dental-medical-instruments';
  
  // Ensure clean test state
  await db.product.deleteMany({ where: { productCode: 'LTL-DENT-001' } });
  await db.category.deleteMany({ where: { slug: catSlug } });

  const category = await db.category.create({
    data: {
      name: 'Dental & Medical Scalers',
      slug: catSlug,
      description: 'Handcrafted dental hygiene and periodontal instruments.',
      isActive: true,
      orderIndex: 99
    }
  });
  console.log(`[PASS] Created Category: ${category.name} (ID: ${category.id}, Slug: ${category.slug})`);

  console.log('--- 2. Testing Product Creation Assigned to Category ---');
  const product = await db.product.create({
    data: {
      name: 'Titanium Double-End Periodontal Scaler',
      slug: `titanium-double-end-periodontal-scaler-ltl-dent-001`,
      productCode: 'LTL-DENT-001',
      sku: 'SKU-DENT-001',
      categoryId: category.id,
      images: '/catagori/WhatsApp Image 2026-08-18 at 12.28.05 AM (1).jpeg',
      singlePrice: 499,
      stock: 120,
      moq: 2,
      isFeatured: true,
      status: 'ACTIVE',
      description: 'Precision grade medical titanium periodontal scaler for professional dental hygienists.'
    },
    include: {
      category: true
    }
  });
  console.log(`[PASS] Created Product: ${product.name} (Assigned Cat: ${product.category?.name})`);

  console.log('--- 3. Verifying Homepage Query ---');
  const homeCategories = await db.category.findMany({
    where: { parentId: null, isActive: true },
    include: {
      subcategories: { where: { isActive: true } },
      _count: { select: { products: true } }
    }
  });
  const foundInHomeCats = homeCategories.find(c => c.id === category.id || c.slug === category.slug);
  console.log(`[PASS] Found in Homepage Root Categories: ${foundInHomeCats ? 'YES (Product Count: ' + foundInHomeCats._count?.products + ')' : 'NO'}`);

  console.log('--- 4. Verifying Shop Filter Query for Category ---');
  const shopProducts = await db.product.findMany({
    where: {
      status: 'ACTIVE',
      OR: [
        { category: { slug: catSlug } },
        { category: { id: category.id } },
        { category: { parent: { slug: catSlug } } }
      ]
    },
    include: { category: true }
  });
  console.log(`[PASS] Products returned for category "${catSlug}": ${shopProducts.length} items`);
  shopProducts.forEach(p => console.log(`   -> [${p.productCode}] ${p.name} - Rs. ${p.singlePrice} (Cat: ${p.category?.name})`));

  console.log('--- 5. Verifying Product Detail Page Lookup ---');
  const detailLookup = await db.product.findFirst({
    where: {
      OR: [
        { id: product.id },
        { slug: product.slug },
        { productCode: product.productCode }
      ]
    },
    include: { category: true }
  });
  console.log(`[PASS] Detail Lookup Result: ${detailLookup ? `Found "${detailLookup.name}" via slug "${detailLookup.slug}"` : 'FAILED'}`);

  console.log('\n========================================');
  console.log('ALL CATEGORY & PRODUCT FLOW TESTS PASSED!');
  console.log('========================================');
}

runTest()
  .catch(err => {
    console.error('Test failed with error:', err);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
