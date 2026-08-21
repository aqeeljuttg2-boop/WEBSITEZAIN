import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Starting Lash Tweezers Lounge 100-Product Seeding ---');

  // 1. Clear existing records cleanly
  await prisma.review.deleteMany({});
  await prisma.wishlist.deleteMany({});
  await prisma.pricingTier.deleteMany({});
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.rfqItem.deleteMany({});
  await prisma.rfq.deleteMany({});
  await prisma.coupon.deleteMany({});
  await prisma.setting.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('1. Database cleared successfully.');

  // 2. Seed Users
  const adminPassword = await bcrypt.hash('admin123', 10);
  const customerPassword = await bcrypt.hash('customer123', 10);

  await prisma.user.create({
    data: {
      name: 'Lash Tweezers Lounge Admin',
      email: 'admin@lashtweezerslounge.com',
      password: adminPassword,
      role: 'SUPERADMIN',
      phone: '+92-334-8012580',
      whatsapp: '+92-334-8012580',
      company: 'Lash Tweezers lounge',
      country: 'Pakistan',
      address: 'King99 Street Block No.99 Wajid Town, Dhattal Stop',
      city: 'Sialkot',
      zipCode: '51310',
    },
  });

  await prisma.user.create({
    data: {
      name: 'Lash Lounge Customer',
      email: 'customer@lashtweezerslounge.com',
      password: customerPassword,
      role: 'CUSTOMER',
      phone: '+92-334-8012580',
      whatsapp: '+92-334-8012580',
      company: 'Lash Salon & Studio',
      country: 'Pakistan',
      address: 'King99 Street Block No.99 Wajid Town, Dhattal Stop',
      city: 'Sialkot',
      zipCode: '51310',
    },
  });

  console.log('2. Users seeded.');

  // 3. Seed Global Settings
  const settings = [
    { key: 'companyName', value: 'Lash Tweezers lounge', description: 'Store name' },
    { key: 'companyEmail', value: 'info@lashtweezerslounge.com', description: 'Contact email' },
    { key: 'companyPhone', value: '+92-334-8012580', description: 'Contact phone' },
    { key: 'whatsappNumber', value: '+923348012580', description: 'WhatsApp contact number' },
    { key: 'companyAddress', value: 'King99 Street Block No.99 Wajid Town, Dhattal Stop, Sialkot.', description: 'Company address' },
    { key: 'instagramUrl', value: 'https://www.instagram.com/lash_tweezers_lounge?igsi=dGl5cWUweXp0MDdj&utm_source=qr', description: 'Official Instagram Profile' },
    { key: 'currency', value: 'PKR', description: 'Default currency code' },
    { key: 'currencySymbol', value: 'Rs.', description: 'Default currency symbol' },
    { key: 'taxRate', value: '0.05', description: 'Sales tax rate (5%)' },
    { key: 'shippingRate', value: '150.00', description: 'Flat rate domestic shipping fee' },
    { key: 'freeShippingThreshold', value: '2500.00', description: 'Free shipping order threshold' },
    { key: 'seoTitle', value: 'Lash Tweezers Lounge | Handcrafted Lash Tweezers & Shears', description: 'Default home page title' },
    { key: 'seoDescription', value: 'Premium export-quality eyelash extension tweezers, volume lash clamps, barber shears, cuticle nippers, and grooming kits from Lash Tweezers Lounge Sialkot.', description: 'Default meta description' },
    { key: 'seoKeywords', value: 'lash tweezers, eyelash extension tweezers, volume tweezers, barber shears, cuticle nippers, Sialkot manufacturer, Lash Tweezers Lounge', description: 'Meta keywords' }
  ];

  for (const s of settings) {
    await prisma.setting.create({ data: s });
  }

  console.log('3. Global store settings seeded.');

  // 4. Seed Root Categories and Subcategories
  // Category 1: Tweezers & Lash Care
  const catTweezers = await prisma.category.create({
    data: {
      name: 'Tweezers & Lash Care',
      slug: 'tweezers-lash-care',
      description: 'Handcrafted isolation tweezers, 3D/6D volume fans, boot tips, diamond-grip tools, and eyelash extension accessories.',
      image: '/products/WhatsApp Image 2026-08-19 at 10.29.48 PM.jpeg',
      orderIndex: 0,
    },
  });

  const subIsolation = await prisma.category.create({
    data: {
      name: 'Precision Isolation Tweezers',
      slug: 'eyelash-tweezers',
      description: 'Ultra-fine 45° & 90° straight isolation tweezers with hand-filed zero-gap tips.',
      image: '/products/WhatsApp Image 2026-08-19 at 10.29.50 PM.jpeg',
      parentId: catTweezers.id,
      orderIndex: 0,
    },
  });

  const subVolume = await prisma.category.create({
    data: {
      name: 'Volume & Mega Fan Tweezers',
      slug: 'volume-tweezers',
      description: 'Fiber-tip, boot-shape, and diamond-coated tweezers engineered for effortless Russian volume fans.',
      image: '/products/WhatsApp Image 2026-08-19 at 10.29.51 PM.jpeg',
      parentId: catTweezers.id,
      orderIndex: 1,
    },
  });

  const subFiberTip = await prisma.category.create({
    data: {
      name: 'Fiber Tip Precision Tweezers',
      slug: 'fiber-tip-tweezers',
      description: 'Micro-hexagonal laser patterned fiber tips for maximum grip and zero lash slippage.',
      image: '/products/WhatsApp Image 2026-08-19 at 10.29.54 PM.jpeg',
      parentId: catTweezers.id,
      orderIndex: 2,
    },
  });

  const subCurved = await prisma.category.create({
    data: {
      name: 'Curved & Semi-Curved Tweezers',
      slug: 'curved-tweezers',
      description: 'Ergonomic dolphin and swan neck tweezers for smooth natural lash placement.',
      image: '/products/WhatsApp Image 2026-08-19 at 10.29.56 PM.jpeg',
      parentId: catTweezers.id,
      orderIndex: 3,
    },
  });

  // Category 2: Hair Styling Shears
  const catShears = await prisma.category.create({
    data: {
      name: 'Hair Styling Shears',
      slug: 'hair-styling-shears',
      description: 'Handcrafted Japanese 440C Cobalt Steel cutting, texturizing, and left-handed salon shears.',
      image: '/products/WhatsApp Image 2026-08-19 at 10.30.00 PM.jpeg',
      orderIndex: 1,
    },
  });

  const subBarber = await prisma.category.create({
    data: {
      name: 'Professional Barber Shears',
      slug: 'barber-shears',
      description: 'Convex razor edge blades, offset cranes, and paper-coated anti-slip grips.',
      image: '/products/WhatsApp Image 2026-08-19 at 10.30.02 PM.jpeg',
      parentId: catShears.id,
      orderIndex: 0,
    },
  });

  const subThinning = await prisma.category.create({
    data: {
      name: 'Texturizing & Thinning Shears',
      slug: 'thinning-shears',
      description: '28–40 tooth chunking and blending scissors with micro-serrated teeth.',
      image: '/products/WhatsApp Image 2026-08-19 at 10.30.04 PM.jpeg',
      parentId: catShears.id,
      orderIndex: 1,
    },
  });

  const subLeftHanded = await prisma.category.create({
    data: {
      name: 'Left Handed Barber Shears',
      slug: 'left-handed-shears',
      description: 'True inverse blades calibrated specifically for left-handed artists.',
      image: '/products/WhatsApp Image 2026-08-19 at 10.30.06 PM.jpeg',
      parentId: catShears.id,
      orderIndex: 2,
    },
  });

  const subTitanium = await prisma.category.create({
    data: {
      name: 'Titanium Coated Hair Scissors',
      slug: 'titanium-shears',
      description: 'Plasma PVD rainbow, rose gold, and jet black titanium coated instruments.',
      image: '/products/WhatsApp Image 2026-08-19 at 10.30.08 PM.jpeg',
      parentId: catShears.id,
      orderIndex: 3,
    },
  });

  // Category 3: Nail & Cuticle Care
  const catNail = await prisma.category.create({
    data: {
      name: 'Nail & Cuticle Care',
      slug: 'nail-cuticle-care',
      description: 'Surgical stainless steel cuticle nippers, pushers, curettes, and pedicure tools.',
      image: '/products/WhatsApp Image 2026-08-19 at 10.30.12 PM.jpeg',
      orderIndex: 2,
    },
  });

  const subNippers = await prisma.category.create({
    data: {
      name: 'Cuticle & Nail Nippers',
      slug: 'cuticle-nippers',
      description: 'Box-joint and lap-joint double-spring surgical steel nippers with jaw sizes #12, #14, #16.',
      image: '/products/WhatsApp Image 2026-08-19 at 10.30.14 PM.jpeg',
      parentId: catNail.id,
      orderIndex: 0,
    },
  });

  const subPushers = await prisma.category.create({
    data: {
      name: 'Cuticle Pushers & Cleaners',
      slug: 'cuticle-pushers',
      description: 'Spoon pushers, spear knives, and ergonomic non-slip knurled handles.',
      image: '/products/WhatsApp Image 2026-08-19 at 10.30.16 PM.jpeg',
      parentId: catNail.id,
      orderIndex: 1,
    },
  });

  const subManicure = await prisma.category.create({
    data: {
      name: 'Manicure & Pedicure Sets',
      slug: 'manicure-sets',
      description: 'Complete 5-piece and 10-piece salon grooming sets in zippered leather cases.',
      image: '/products/WhatsApp Image 2026-08-19 at 10.30.18 PM.jpeg',
      parentId: catNail.id,
      orderIndex: 2,
    },
  });

  const subNailArt = await prisma.category.create({
    data: {
      name: 'Nail Art & Tip Cutters',
      slug: 'nail-art-tools',
      description: 'Acrylic tip clippers, pinchers, and nail extension shaping clamps.',
      image: '/products/WhatsApp Image 2026-08-19 at 10.30.20 PM.jpeg',
      parentId: catNail.id,
      orderIndex: 3,
    },
  });

  // Category 4: Shaving & Grooming
  const catShaving = await prisma.category.create({
    data: {
      name: 'Shaving & Grooming',
      slug: 'shaving-grooming',
      description: 'Vintage safety razors, straight cutthroats, badger hair brushes, and beard trimmers.',
      image: '/products/WhatsApp Image 2026-08-19 at 10.30.24 PM.jpeg',
      orderIndex: 3,
    },
  });

  const subSafetyRazors = await prisma.category.create({
    data: {
      name: 'Double Edge Safety Razors',
      slug: 'safety-razors',
      description: '3-piece closed comb and open comb heavy brass/steel double-edge safety razors.',
      image: '/products/WhatsApp Image 2026-08-19 at 10.30.26 PM.jpeg',
      parentId: catShaving.id,
      orderIndex: 0,
    },
  });

  const subStraightRazors = await prisma.category.create({
    data: {
      name: 'Straight Cutthroat Razors',
      slug: 'straight-razors',
      description: 'Barber shavettes with replaceable single-edge blade holders and wooden handles.',
      image: '/products/WhatsApp Image 2026-08-19 at 10.30.28 PM.jpeg',
      parentId: catShaving.id,
      orderIndex: 1,
    },
  });

  const subBrushes = await prisma.category.create({
    data: {
      name: 'Shaving Brushes & Stands',
      slug: 'shaving-brushes',
      description: 'Silvertip synthetic badger shaving brushes and chrome-plated razor display stands.',
      image: '/products/WhatsApp Image 2026-08-19 at 10.30.30 PM.jpeg',
      parentId: catShaving.id,
      orderIndex: 2,
    },
  });

  const subBeard = await prisma.category.create({
    data: {
      name: 'Beard & Mustache Scissors',
      slug: 'beard-grooming',
      description: 'Rounded safety tip micro-shears for precision facial hair and nose trimming.',
      image: '/products/WhatsApp Image 2026-08-19 at 10.30.32 PM.jpeg',
      parentId: catShaving.id,
      orderIndex: 3,
    },
  });

  // Category 5: Beauty Kits & Bags
  const catKits = await prisma.category.create({
    data: {
      name: 'Beauty Kits & Bags',
      slug: 'beauty-kits-bags',
      description: 'Professional barber holsters, scissor pouches, salon starter cases, and magnetic tweezer organizers.',
      image: '/products/WhatsApp Image 2026-08-19 at 10.30.36 PM.jpeg',
      orderIndex: 4,
    },
  });

  const subPouches = await prisma.category.create({
    data: {
      name: 'Professional Tool Pouches',
      slug: 'tool-pouches',
      description: 'Durable salon stylist waist pouches with multiple scissor slots and clip organizers.',
      image: '/products/WhatsApp Image 2026-08-19 at 10.30.38 PM.jpeg',
      parentId: catKits.id,
      orderIndex: 0,
    },
  });

  const subHolsters = await prisma.category.create({
    data: {
      name: 'Leather Holsters & Cases',
      slug: 'leather-cases',
      description: 'Genuine cowhide and velvet-lined luxury instrument carry cases.',
      image: '/products/WhatsApp Image 2026-08-19 at 10.30.40 PM.jpeg',
      parentId: catKits.id,
      orderIndex: 1,
    },
  });

  const subStarterKits = await prisma.category.create({
    data: {
      name: 'Salon Starter Kits',
      slug: 'starter-kits',
      description: 'All-in-one lash extension artist and barber apprentice master instrument bundles.',
      image: '/products/WhatsApp Image 2026-08-19 at 10.30.42 PM.jpeg',
      parentId: catKits.id,
      orderIndex: 2,
    },
  });

  const subMagneticCases = await prisma.category.create({
    data: {
      name: 'Magnetic Tweezer Cases',
      slug: 'magnetic-cases',
      description: 'Hard-shell magnetic click cases to protect delicate hand-ground tweezer tips.',
      image: '/products/WhatsApp Image 2026-08-19 at 10.30.43 PM.jpeg',
      parentId: catKits.id,
      orderIndex: 3,
    },
  });

  console.log('4. Root categories & subcategories seeded.');

  // Subcategory pool for assigning all 100 products
  const categoryPool = [
    subIsolation.id,
    subVolume.id,
    subFiberTip.id,
    subCurved.id,
    subBarber.id,
    subThinning.id,
    subLeftHanded.id,
    subTitanium.id,
    subNippers.id,
    subPushers.id,
    subManicure.id,
    subNailArt.id,
    subSafetyRazors.id,
    subStraightRazors.id,
    subBrushes.id,
    subBeard.id,
    subPouches.id,
    subHolsters.id,
    subStarterKits.id,
    subMagneticCases.id
  ];

  // 5. Read all 100 images from public/products
  const productsDir = path.join(process.cwd(), 'public/products');
  const files = fs.readdirSync(productsDir).filter(f => f.endsWith('.jpeg') || f.endsWith('.jpg') || f.endsWith('.png'));

  console.log(`Found ${files.length} images. Creating exactly ${files.length} individual products (1 image per product)...`);

  const tweezerNames = [
    'Fiber Tip 90° Mega Volume Tweezer',
    'Diamond Grip Boot Tweezer 75°',
    'Ultra-Fine Straight Isolation Tweezer',
    'Dolphin Curved Volume Clamp',
    'L-Shape Sweet-Spot Eyelash Tweezer',
    'Chameleon Plasma Volume Tweezer',
    'Matte Black Hex-Grip Isolation Tool',
    'Titanium Rose Gold Russian Volume Clamp',
    'Slim Tip 45° Classic Lash Tweezer',
    'Heavy-Duty Magnetic Alignment Tweezer'
  ];

  const shearNames = [
    'Japanese 440C Convex Razor Edge Barber Shears',
    'Ergonomic Crane Offset Hair Cutting Shears',
    '30-Tooth Texturizing Thinning Scissors',
    'Left-Handed Master Barber Hair Scissors',
    'Titanium Rainbow Plasma Hair Styling Shears',
    'Matte Jet-Black Professional Barber Shears',
    'Gold Accented Ball-Bearing Tension Shears',
    'Micro-Serrated Precision Cutting Scissors',
    'Swivel Thumb Ergonomic Salon Shears',
    'Cobalt Alloy Feather-Edge Barber Scissors'
  ];

  const nailNames = [
    'Surgical Box-Joint Cuticle Nipper (Jaw #14)',
    'Dual-End Spoon & Spear Cuticle Pusher',
    'Pedicure Heavy Duty Toenail Clipper',
    'Double Spring Stainless Steel Cuticle Trimmer',
    'Sapphire Coated Precision Nail File Tool',
    'Acrylic Tip Edge Shaping Clipper',
    'Curette Ingrown Nail Cleaning Instrument',
    'Matte Finish 5-Piece Salon Manicure Set',
    'Nail Extension C-Curve Pinching Clamp',
    'Surgical Stainless Steel Cuticle Cleaner'
  ];

  const shavingNames = [
    '3-Piece Heavy Brass Safety Razor (Chrome)',
    'Barber Straight Cutthroat Shavette Razor',
    'Silvertip Synthetic Badger Shaving Brush',
    'Chrome Plated Safety Razor & Brush Stand',
    'Rounded Safety Tip Beard & Mustache Scissors',
    'Rosewood Handle Single-Edge Shaving Razor',
    'Matte Black Dual-Comb Safety Razor',
    'Stainless Steel Shaving Bowl & Soap Cup',
    'Travel Compact Safety Razor Leather Pouch',
    'Precision Eyebrow & Facial Grooming Scissors'
  ];

  const kitNames = [
    'Master Stylist 8-Slot Leather Scissor Holster',
    'Velvet-Lined Magnetic 6-Tweezer Hard Case',
    'Salon Professional Waist Apron & Tool Pouch',
    'Apprentice Master Barber 7-Piece Tool Kit',
    'Zippered Leatherette 10-Piece Instrument Case',
    'Lash Artist Compact Anti-Drop Tweezer Holster',
    'Heavy Duty Canvas Tool Roll Organizer',
    'Laser Engraved Acrylic Display Instrument Stand',
    'Deluxe Gold Accent Grooming Travel Case',
    'Surgical Instrument Sterilization Cassette Box'
  ];

  const allNamePools = [tweezerNames, shearNames, nailNames, shavingNames, kitNames];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const itemNumber = i + 1;
    const catIndex = Math.floor(i / 5) % categoryPool.length;
    const categoryId = categoryPool[catIndex];

    const poolIndex = Math.floor(i / 20) % allNamePools.length;
    const namePool = allNamePools[poolIndex];
    const baseName = namePool[i % namePool.length];
    const productName = `${baseName} LTL-Series #${itemNumber}`;

    const padNumber = String(itemNumber).padStart(3, '0');
    const slug = `ltl-${itemNumber}-${baseName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`;
    const sku = `LTL-SKU-${padNumber}`;
    const productCode = `LTL-${1000 + itemNumber}`;

    // Base pricing based on category
    let basePrice = 450;
    if (poolIndex === 1) basePrice = 1450; // Shears
    else if (poolIndex === 2) basePrice = 650;  // Nail
    else if (poolIndex === 3) basePrice = 950;  // Shaving
    else if (poolIndex === 4) basePrice = 1850; // Kits

    const singlePrice = basePrice + (itemNumber % 7) * 25;

    const materials = ['Japanese 440C Cobalt Steel', 'AISI 420 Surgical Stainless Steel', 'Japanese J2 Steel', 'German Grade Stainless Steel', 'Titanium Coated Stainless Steel'];
    const finishes = ['Satin Silver Polish', 'Chameleon Plasma PVD', 'Matte Sandblasted Black', 'Mirror Chrome Buffed', 'Rose Gold PVD Plating', 'Paper Coated Ergonomic Grip'];

    const material = materials[itemNumber % materials.length];
    const finish = finishes[itemNumber % finishes.length];

    const product = await prisma.product.create({
      data: {
        name: productName,
        slug: slug,
        productCode: productCode,
        sku: sku,
        description: `Precision handcrafted export-grade instrument engineered by Lash Tweezers Lounge. Manufactured from ${material} with an ultra-durable ${finish}. Inspected for exact tip alignment, zero-gap sweet spot closure, and autoclave sterilization resistance.`,
        singlePrice: singlePrice,
        stock: 50 + (itemNumber % 30),
        status: 'ACTIVE',
        images: `/products/${file}`, // Exactly 1 image per product
        material: material,
        finish: finish,
        category: {
          connect: { id: categoryId }
        }
      }
    });

    // Tiered B2B Wholesale Pricing
    await prisma.pricingTier.createMany({
      data: [
        {
          productId: product.id,
          minQuantity: 1,
          maxQuantity: 9,
          pricePerUnit: singlePrice,
        },
        {
          productId: product.id,
          minQuantity: 10,
          maxQuantity: 49,
          pricePerUnit: Math.round(singlePrice * 0.82), // 18% discount
        },
        {
          productId: product.id,
          minQuantity: 50,
          maxQuantity: null,
          pricePerUnit: Math.round(singlePrice * 0.68), // 32% wholesale discount
        }
      ]
    });
  }

  console.log(`5. Successfully created all ${files.length} individual products (1 image per product)!`);

  // 6. Seed Coupons
  await prisma.coupon.create({
    data: {
      code: 'LTL10',
      discountType: 'PERCENTAGE',
      value: 10.0,
      minOrderValue: 1500.0,
      maxDiscountAmount: 500.0,
      startDate: new Date(),
      endDate: new Date('2028-12-31'),
      usageLimit: 500,
      usageCount: 12,
      status: 'ACTIVE'
    }
  });

  await prisma.coupon.create({
    data: {
      code: 'WHOLESALE20',
      discountType: 'PERCENTAGE',
      value: 20.0,
      minOrderValue: 10000.0,
      maxDiscountAmount: 5000.0,
      startDate: new Date(),
      endDate: new Date('2028-12-31'),
      usageLimit: 200,
      usageCount: 5,
      status: 'ACTIVE'
    }
  });

  console.log('6. Coupons seeded.');
  console.log('--- All Seeding Complete! ---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
