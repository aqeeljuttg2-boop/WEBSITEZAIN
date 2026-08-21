import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();
const BASE_URL = 'http://localhost:3000';

interface TestResult {
  suite: string;
  name: string;
  passed: boolean;
  statusCode?: number;
  durationMs: number;
  error?: string;
  details?: string;
}

const results: TestResult[] = [];

async function testEndpoint(
  suite: string,
  name: string,
  url: string,
  options?: RequestInit,
  expectedStatus: number | number[] = 200,
  validateJson?: (data: any) => boolean | string
) {
  const start = Date.now();
  try {
    const res = await fetch(`${BASE_URL}${url}`, options);
    const durationMs = Date.now() - start;
    const expected = Array.isArray(expectedStatus) ? expectedStatus : [expectedStatus];
    
    if (!expected.includes(res.status)) {
      results.push({
        suite,
        name,
        passed: false,
        statusCode: res.status,
        durationMs,
        error: `Expected status ${expected.join('/')}, got ${res.status}`,
      });
      return null;
    }

    let jsonData = null;
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      try {
        jsonData = await res.json();
      } catch (e: any) {
        results.push({
          suite,
          name,
          passed: false,
          statusCode: res.status,
          durationMs,
          error: `Invalid JSON response: ${e.message}`,
        });
        return null;
      }
    }

    if (validateJson && jsonData) {
      const validationResult = validateJson(jsonData);
      if (validationResult !== true) {
        results.push({
          suite,
          name,
          passed: false,
          statusCode: res.status,
          durationMs,
          error: typeof validationResult === 'string' ? validationResult : 'JSON validation failed',
        });
        return jsonData;
      }
    }

    results.push({
      suite,
      name,
      passed: true,
      statusCode: res.status,
      durationMs,
    });
    return jsonData;
  } catch (err: any) {
    results.push({
      suite,
      name,
      passed: false,
      durationMs: Date.now() - start,
      error: `Network/Fetch error: ${err.message}`,
    });
    return null;
  }
}

async function runAudit() {
  console.log('====================================================');
  console.log('🚀 RUNNING FULL END-TO-END SYSTEM & CODEBASE AUDIT');
  console.log('====================================================\n');

  // 1. PUBLIC STOREFRONT PAGES
  console.log('--- 1. Testing Storefront Public Pages ---');
  const publicPages = [
    { name: 'Home Page', path: '/' },
    { name: 'Shop / Catalog Page', path: '/shop' },
    { name: 'Catalog Download Page', path: '/catalog' },
    { name: 'Cart Page', path: '/cart' },
    { name: 'Checkout Page', path: '/checkout' },
    { name: 'RFQ Quote Request Page', path: '/quote' },
    { name: 'Order Tracking Page', path: '/tracking' },
    { name: 'Login Page', path: '/login' },
    { name: 'Register Page', path: '/register' },
    { name: 'My Account Page', path: '/account' },
    { name: 'Account Orders', path: '/account/orders' },
    { name: 'Account Quotes', path: '/account/quotes' },
    { name: 'About Us Page', path: '/about' },
    { name: 'Contact Us Page', path: '/contact' },
    { name: 'FAQ Page', path: '/faq' },
    { name: 'Privacy Policy Page', path: '/privacy' },
    { name: 'Terms of Service Page', path: '/terms' },
    { name: 'Shipping Policy Page', path: '/shipping' },
    { name: 'Returns Policy Page', path: '/returns' },
    { name: 'Manufacturing Page', path: '/manufacturing' },
    { name: 'Quality Assurance Page', path: '/quality' },
    { name: 'Wholesale Inquiry Page', path: '/wholesale' },
    { name: 'Certificates Page', path: '/certificates' },
    { name: 'Blog Page', path: '/blog' },
    { name: 'Robots.txt', path: '/robots.txt' },
    { name: 'Sitemap.xml', path: '/sitemap.xml' },
  ];

  for (const page of publicPages) {
    await testEndpoint('Public Pages', page.name, page.path);
  }

  // 2. ADMIN PAGES
  console.log('--- 2. Testing Admin Control Center Pages ---');
  const adminPages = [
    { name: 'Admin Dashboard Overview', path: '/admin' },
    { name: 'Admin Products Management', path: '/admin/products' },
    { name: 'Admin Categories Management', path: '/admin/categories' },
    { name: 'Admin Orders Management', path: '/admin/orders' },
    { name: 'Admin RFQ Quotes Management', path: '/admin/rfq' },
    { name: 'Admin Customers Management', path: '/admin/customers' },
    { name: 'Admin Reviews Management', path: '/admin/reviews' },
    { name: 'Admin Homepage CMS', path: '/admin/homepage' },
    { name: 'Admin Banners CMS', path: '/admin/banners' },
    { name: 'Admin Brands CMS', path: '/admin/brands' },
    { name: 'Admin Media Library', path: '/admin/media' },
    { name: 'Admin Navigation Menus', path: '/admin/menus' },
    { name: 'Admin CMS Pages', path: '/admin/pages' },
    { name: 'Admin SEO Management', path: '/admin/seo' },
    { name: 'Admin Settings & WhatsApp', path: '/admin/settings' },
    { name: 'Admin Coupons Management', path: '/admin/coupons' },
  ];

  for (const page of adminPages) {
    await testEndpoint('Admin Pages', page.name, page.path);
  }

  // 3. STOREFRONT APIS
  console.log('--- 3. Testing Storefront API Routes ---');
  
  // Products API
  const productsData = await testEndpoint(
    'Storefront API',
    'GET /api/products (List products)',
    '/api/products',
    undefined,
    200,
    (d) => Array.isArray(d.products) && d.products.length > 0 || 'Expected products array'
  );

  let sampleProductId = '';
  if (productsData && productsData.products && productsData.products.length > 0) {
    const p = productsData.products[0];
    sampleProductId = p.id;
    console.log(`  Found sample product: ${p.name || p.title} (ID: ${sampleProductId})`);
    
    // Test Single Product Page
    await testEndpoint('Public Pages', `Product Detail Page (/product/${sampleProductId})`, `/product/${sampleProductId}`);
    
    // Test Single Product API
    await testEndpoint(
      'Storefront API',
      `GET /api/products/${sampleProductId} (Single Product API)`,
      `/api/products/${sampleProductId}`,
      undefined,
      200,
      (d) => (d.product?.id === sampleProductId || d.id === sampleProductId) || 'Product ID mismatch'
    );
  }

  // Test Products search & filter
  await testEndpoint(
    'Storefront API',
    'GET /api/products with search & filters',
    '/api/products?search=tweezer&page=1&limit=5',
    undefined,
    200,
    (d) => Array.isArray(d.products) || 'Invalid search response'
  );

  // Categories API
  const categoriesData = await testEndpoint(
    'Storefront API',
    'GET /api/categories (Categories List)',
    '/api/categories',
    undefined,
    200,
    (d) => Array.isArray(d) || Array.isArray(d.categories) || 'Expected categories array'
  );

  let sampleCategoryId = '';
  const cats = Array.isArray(categoriesData) ? categoriesData : (categoriesData?.categories || []);
  if (cats.length > 0) {
    sampleCategoryId = cats[0].id;
    await testEndpoint(
      'Storefront API',
      `GET /api/categories/${sampleCategoryId}`,
      `/api/categories/${sampleCategoryId}`,
      undefined,
      200
    );
  }

  // Reviews API GET
  await testEndpoint(
    'Storefront API',
    'GET /api/reviews',
    sampleProductId ? `/api/reviews?productId=${sampleProductId}` : '/api/reviews',
    undefined,
    200,
    (d) => Array.isArray(d.reviews) || 'Expected reviews array'
  );

  // RFQ Submission Test (POST)
  await testEndpoint(
    'Storefront API',
    'POST /api/rfq (Submit Quote Request)',
    '/api/rfq',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Audit Test User',
        email: 'audit@lashtweezerslounge.com',
        phone: '+923001234567',
        company: 'Audit Instruments Inc',
        country: 'United States',
        notes: 'Automated system audit quote test',
        items: sampleProductId ? [{ productId: sampleProductId, quantity: 50, notes: 'Sample RFQ item' }] : [{ productCode: 'LTL-CUSTOM-01', productName: 'Custom Gold Tweezer', quantity: 20 }]
      })
    },
    [200, 201],
    (d) => (d.success === true || d.id !== undefined || d.rfqNumber !== undefined) || 'RFQ submission payload failed'
  );

  // Order Placement Test (POST)
  await testEndpoint(
    'Storefront API',
    'POST /api/orders (Checkout Submission)',
    '/api/orders',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName: 'Audit Test Customer',
        customerEmail: 'auditcustomer@lashtweezerslounge.com',
        customerPhone: '+923001234567',
        shippingAddress: 'Audit Street 1, Suite 100',
        city: 'Lahore',
        postalCode: '54000',
        country: 'Pakistan',
        paymentMethod: 'COD',
        shippingFee: 150,
        subtotal: 1000,
        tax: 50,
        total: 1200,
        items: sampleProductId ? [{ productId: sampleProductId, quantity: 2, unitPrice: 500, totalPrice: 1000, title: 'Sample Product' }] : []
      })
    },
    [200, 201],
    (d) => (d.success === true || d.orderNumber !== undefined || d.order !== undefined || d.id !== undefined) || 'Order placement failed'
  );

  // 4. ADMIN APIS (WITH SUPERADMIN AUTHENTICATION)
  console.log('--- 4. Testing Admin API Endpoints & CMS Controls ---');
  
  // Find or create admin token for authenticated testing
  const adminUser = await prisma.user.findFirst({ where: { role: 'SUPERADMIN' } });
  let adminAuthCookie = '';
  if (adminUser) {
    const { signToken } = await import('../src/lib/auth.js');
    const token = signToken({
      userId: adminUser.id,
      email: adminUser.email,
      role: adminUser.role,
      name: adminUser.name
    });
    adminAuthCookie = `apex_auth_token=${token}`;
    console.log(`  Generated admin auth token for user: ${adminUser.email}`);
  }

  const adminHeaders = {
    'Content-Type': 'application/json',
    'Cookie': adminAuthCookie
  };

  // Analytics
  await testEndpoint('Admin API', 'GET /api/admin/analytics', '/api/admin/analytics', { headers: adminHeaders }, 200);

  // Settings
  await testEndpoint('Admin API', 'GET /api/admin/settings', '/api/admin/settings', { headers: adminHeaders }, 200);
  await testEndpoint(
    'Admin API',
    'PUT /api/admin/settings (Update test)',
    '/api/admin/settings',
    {
      method: 'PUT',
      headers: adminHeaders,
      body: JSON.stringify({
        companyName: 'Lash Tweezers lounge'
      })
    },
    200
  );

  // Homepage CMS
  await testEndpoint('Admin API', 'GET /api/admin/homepage', '/api/admin/homepage', { headers: adminHeaders }, 200);

  // Banners CMS
  await testEndpoint('Admin API', 'GET /api/admin/banners', '/api/admin/banners', { headers: adminHeaders }, 200);

  // Brands CMS
  await testEndpoint('Admin API', 'GET /api/admin/brands', '/api/admin/brands', { headers: adminHeaders }, 200);

  // Customers
  await testEndpoint('Admin API', 'GET /api/admin/customers', '/api/admin/customers', { headers: adminHeaders }, 200);

  // Orders
  await testEndpoint('Admin API', 'GET /api/admin/orders', '/api/admin/orders', { headers: adminHeaders }, 200);

  // RFQs
  await testEndpoint('Admin API', 'GET /api/admin/rfq', '/api/admin/rfq', { headers: adminHeaders }, 200);

  // Reviews
  await testEndpoint('Admin API', 'GET /api/admin/reviews', '/api/admin/reviews', { headers: adminHeaders }, 200);

  // Media Library
  await testEndpoint('Admin API', 'GET /api/admin/media', '/api/admin/media', { headers: adminHeaders }, 200);

  // Navigation Menus
  await testEndpoint('Admin API', 'GET /api/admin/menus', '/api/admin/menus', { headers: adminHeaders }, 200);

  // Dynamic CMS Pages
  await testEndpoint('Admin API', 'GET /api/admin/pages', '/api/admin/pages', { headers: adminHeaders }, 200);

  // SEO Management
  await testEndpoint('Admin API', 'GET /api/admin/seo', '/api/admin/seo', { headers: adminHeaders }, 200);

  // Coupons Management
  await testEndpoint('Admin API', 'GET /api/admin/coupons', '/api/admin/coupons', { headers: adminHeaders }, 200);

  // Export Products
  await testEndpoint('Admin API', 'GET /api/admin/products/export', '/api/admin/products/export', { headers: adminHeaders }, 200);

  // 5. DATABASE INTEGRITY & IMAGE ASSET VALIDATION
  console.log('--- 5. Checking Database Integrity & Image Assets ---');
  
  const totalProducts = await prisma.product.count();
  const totalCategories = await prisma.category.count();
  const totalOrders = await prisma.order.count();
  const totalRfqs = await prisma.rfq.count();
  const totalBanners = await prisma.banner.count();
  const totalPages = await prisma.page.count();
  const totalSettings = await prisma.setting.count();

  console.log(`  Database Stats:`);
  console.log(`  - Products: ${totalProducts}`);
  console.log(`  - Categories: ${totalCategories}`);
  console.log(`  - Orders: ${totalOrders}`);
  console.log(`  - RFQs: ${totalRfqs}`);
  console.log(`  - Banners: ${totalBanners}`);
  console.log(`  - CMS Pages: ${totalPages}`);
  console.log(`  - Settings: ${totalSettings}`);

  // Check product image paths
  const allProducts = await prisma.product.findMany({
    select: { id: true, name: true, images: true, categoryId: true }
  });

  let missingImageCount = 0;
  let invalidJsonImages = 0;

  for (const prod of allProducts) {
    try {
      let imgList: string[] = [];
      if (typeof prod.images === 'string') {
        try {
          const parsed = JSON.parse(prod.images);
          imgList = Array.isArray(parsed) ? parsed : [prod.images];
        } catch {
          imgList = prod.images.split(',').map(s => s.trim()).filter(Boolean);
        }
      } else if (Array.isArray(prod.images)) {
        imgList = prod.images;
      }

      for (const img of imgList) {
        if (img && img.startsWith('/') && !img.startsWith('http') && !img.startsWith('data:')) {
          const fullPath = path.join(process.cwd(), 'public', decodeURIComponent(img));
          if (!fs.existsSync(fullPath)) {
            missingImageCount++;
            // console.warn(`Missing file for product "${prod.name}": ${img}`);
          }
        }
      }
    } catch {
      invalidJsonImages++;
    }
  }

  results.push({
    suite: 'Data Integrity',
    name: 'Product Images Integrity Check',
    passed: missingImageCount === 0,
    durationMs: 10,
    details: `Total products: ${allProducts.length}. Missing images: ${missingImageCount}`,
    error: missingImageCount > 0 ? `${missingImageCount} product images missing from /public folder` : undefined
  });

  // SUMMARY REPORT
  console.log('\n====================================================');
  console.log('📊 AUDIT RESULTS SUMMARY');
  console.log('====================================================\n');

  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = results.filter((r) => !r.passed).length;

  console.log(`Total Tests Run: ${results.length}`);
  console.log(`Passed: ${passedCount} ✅`);
  console.log(`Failed: ${failedCount} ❌\n`);

  if (failedCount > 0) {
    console.log('🚨 FAILED TESTS DETAILS:');
    results.filter((r) => !r.passed).forEach((r) => {
      console.log(`  ❌ [${r.suite}] ${r.name}`);
      console.log(`     Status: ${r.statusCode || 'N/A'}`);
      console.log(`     Error: ${r.error}`);
      if (r.details) console.log(`     Details: ${r.details}`);
    });
  } else {
    console.log('🎉 ALL SUITES PASSED! Zero errors detected across all tested routes, pages, and endpoints.');
  }

  // Save audit results to JSON for review
  fs.writeFileSync(
    path.join(process.cwd(), 'scripts', 'audit_report.json'),
    JSON.stringify({ timestamp: new Date().toISOString(), total: results.length, passed: passedCount, failed: failedCount, results }, null, 2)
  );

  await prisma.$disconnect();
}

runAudit().catch((err) => {
  console.error('Fatal audit suite error:', err);
  process.exit(1);
});
