import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Seeding CMS Initial Data ---');

  // 1. Settings
  const defaultSettings: { key: string; value: string; description: string }[] = [
    { key: 'companyName', value: 'Lash Tweezers lounge', description: 'Store name' },
    { key: 'companyEmail', value: 'info@lashtweezerslounge.com', description: 'Contact email' },
    { key: 'companyPhone', value: '+92-334-8012580', description: 'Contact phone' },
    { key: 'whatsappNumber', value: '+923348012580', description: 'WhatsApp contact number' },
    { key: 'companyAddress', value: 'King99 Street Block No.99 Wajid Town, Dhattal Stop, Sialkot.', description: 'Company address' },
    { key: 'instagramUrl', value: 'https://www.instagram.com/lash_tweezers_lounge?igsi=dGl5cWUweXp0MDdj&utm_source=qr', description: 'Official Instagram Profile' },
    { key: 'facebookUrl', value: 'https://facebook.com', description: 'Facebook Page' },
    { key: 'youtubeUrl', value: 'https://youtube.com', description: 'YouTube Channel' },
    { key: 'linkedinUrl', value: 'https://linkedin.com', description: 'LinkedIn Profile' },
    { key: 'currency', value: 'PKR', description: 'Default currency code' },
    { key: 'currencySymbol', value: 'Rs.', description: 'Default currency symbol' },
    { key: 'taxRate', value: '0.05', description: 'Sales tax rate (5%)' },
    { key: 'shippingRate', value: '150.00', description: 'Flat rate domestic shipping fee' },
    { key: 'freeShippingThreshold', value: '2500.00', description: 'Free shipping order threshold' },
    { key: 'minOrderQuantity', value: '1', description: 'Global minimum order quantity' },
    { key: 'businessHours', value: 'Mon - Sat: 9:00 AM - 6:00 PM (PKT)', description: 'Business Operating Hours' },
    { key: 'seoTitle', value: 'Lash Tweezers Lounge | Handcrafted Lash Tweezers & Shears', description: 'Default home page title' },
    { key: 'seoDescription', value: 'Premium export-quality eyelash extension tweezers, volume lash clamps, barber shears, cuticle nippers, and grooming kits from Lash Tweezers Lounge Sialkot.', description: 'Default meta description' },
    { key: 'seoKeywords', value: 'lash tweezers, eyelash extension tweezers, volume tweezers, barber shears, cuticle nippers, Sialkot manufacturer, Lash Tweezers Lounge', description: 'Meta keywords' },
    { key: 'announcementText', value: 'Manufacturer & Global Exporter • Worldwide Express Shipping Available', description: 'Top Header Announcement Banner Text' },
    { key: 'whatsappGreeting', value: "Hello! Welcome to Lash Tweezers Lounge. How can we assist you with our salon & beauty instruments today?", description: 'Default WhatsApp Greeting' },
    { key: 'whatsappProductTemplate', value: "Hi, I'm interested in ordering/inquiring about: {product_name} (Code: {sku}). Quantity: {quantity}. Please provide pricing and shipping details. {url}", description: 'WhatsApp template when inquiring about a product' },
    { key: 'whatsappQuoteTemplate', value: "Hi, I would like to request a custom B2B wholesale quotation from Lash Tweezers Lounge.", description: 'WhatsApp template for custom quote requests' },
    { key: 'floatingWhatsappEnabled', value: 'true', description: 'Enable/disable floating WhatsApp button' }
  ];

  for (const s of defaultSettings) {
    await prisma.setting.upsert({
      where: { key: s.key },
      update: {},
      create: s
    });
  }
  console.log(`✓ Seeded/verified ${defaultSettings.length} Settings`);

  // 2. Banners & Hero Slides
  const heroBanners = [
    {
      title: 'LASH TWEEZERS & ISOLATION CLAMPS',
      subtitle: 'Handcrafted Boot Mega 75°, L-Type, and isolation tweezers made from premium Japanese Cobalt steel for volume fan excellence.',
      badge: 'PREMIUM BEAUTY INSTRUMENTS',
      buttonText: 'Shop Eyelash Tweezers',
      buttonUrl: '/shop?category=eyelash-tweezers',
      secondaryButtonText: 'Download Catalog',
      secondaryButtonUrl: '/catalog',
      desktopImage: '/catagori/WhatsApp Image 2026-08-18 at 12.28.05 AM (1).jpeg',
      mobileImage: '/catagori/WhatsApp Image 2026-08-18 at 12.28.05 AM (1).jpeg',
      position: 'HERO_SLIDER',
      isActive: true,
      orderIndex: 0
    },
    {
      title: 'RAZOR EDGE BARBER SHEARS',
      subtitle: 'Handcrafted from Japan 440C Cobalt Steel. Features convex razor-edge blades, adjustable tension dial, and ergonomic paper-coated grip options.',
      badge: 'PROFESSIONAL HAIR SHEARS',
      buttonText: 'Explore Barber Shears',
      buttonUrl: '/shop?category=barber-shears',
      secondaryButtonText: 'Request B2B Quote',
      secondaryButtonUrl: '/quote',
      desktopImage: '/catagori/WhatsApp Image 2026-08-18 at 12.28.11 AM.jpeg',
      mobileImage: '/catagori/WhatsApp Image 2026-08-18 at 12.28.11 AM.jpeg',
      position: 'HERO_SLIDER',
      isActive: true,
      orderIndex: 1
    },
    {
      title: 'MANICURE & GROOMING ESSENTIALS',
      subtitle: 'Surgical stainless steel cuticle nippers, nail pushers, and luxury double-edge safety razors forged for salon longevity.',
      badge: 'ESTHETICIAN & BARBER GRADE',
      buttonText: 'Shop Grooming Tools',
      buttonUrl: '/shop?category=cuticle-nippers',
      secondaryButtonText: 'Wholesale Inquiry',
      secondaryButtonUrl: '/wholesale',
      desktopImage: '/catagori/WhatsApp Image 2026-08-18 at 12.28.12 AM.jpeg',
      mobileImage: '/catagori/WhatsApp Image 2026-08-18 at 12.28.12 AM.jpeg',
      position: 'PROMO_STRIP',
      isActive: true,
      orderIndex: 2
    }
  ];

  const existingBanners = await prisma.banner.count();
  if (existingBanners === 0) {
    for (const b of heroBanners) {
      await prisma.banner.create({ data: b });
    }
    console.log(`✓ Seeded ${heroBanners.length} Banners`);
  }

  // 3. Homepage Sections
  const defaultSections = [
    {
      sectionKey: 'hero',
      title: 'Hero Banner Slider',
      subtitle: 'Interactive animated slider with product showcases',
      badge: 'HERO_SECTION',
      content: '',
      buttonText: '',
      buttonUrl: '',
      imageUrl: '',
      isEnabled: true,
      orderIndex: 0
    },
    {
      sectionKey: 'categories',
      title: 'Featured Category Grid',
      subtitle: 'Discover top categories from our precision catalog',
      badge: 'CATEGORIES',
      content: '',
      buttonText: 'View All Categories',
      buttonUrl: '/shop',
      imageUrl: '',
      isEnabled: true,
      orderIndex: 1
    },
    {
      sectionKey: 'trending_tweezers',
      title: 'Precision Lash Tweezers',
      subtitle: 'Isolate, clamp, and pick up lash fans effortlessly with our hand-aligned, medical-grade tweezers.',
      badge: 'TRENDING INSTRUMENTS',
      content: '',
      buttonText: 'Shop All Tweezers',
      buttonUrl: '/shop?category=eyelash-tweezers',
      imageUrl: '',
      isEnabled: true,
      orderIndex: 2
    },
    {
      sectionKey: 'shears_banner',
      title: 'Professional Barber Shears',
      subtitle: 'Lash Tweezers Lounge designs and manufactures handcrafted razor-edge barber shears and texturizing thinning scissors. Made of premium Japan 440C Cobalt steel, our shears provide long-lasting sharpness, friction-free pivot dials, and comfortable ergonomic finger fits.',
      badge: 'GENERATIONAL FORGING',
      buttonText: 'Browse Shears',
      buttonUrl: '/shop?category=hair-styling-shears',
      imageUrl: '/catagori/WhatsApp Image 2026-08-18 at 12.28.11 AM.jpeg',
      isEnabled: true,
      orderIndex: 3
    },
    {
      sectionKey: 'grooming_tabs',
      title: 'Master Your Grooming!',
      subtitle: 'Experience professional-grade beauty and grooming tools. Precision cuticle nippers, surgical steel pushers, double-edge safety razors, and genuine leather holsters.',
      badge: 'Lash Tweezers Lounge Grooming & Manicure',
      content: '',
      buttonText: '',
      buttonUrl: '',
      imageUrl: '/catagori/WhatsApp Image 2026-08-18 at 12.28.09 AM.jpeg',
      isEnabled: true,
      orderIndex: 4
    },
    {
      sectionKey: 'shaving_banner',
      title: 'Premium Safety Razors & Bowls',
      subtitle: 'Experience the art of traditional wet shaving: solid brass safety razors, hand-finished badger hair shaving brushes, and oak-stained mango hardwood shaving bowls.',
      badge: 'SHAVING & GROOMING',
      buttonText: 'Browse Razors',
      buttonUrl: '/shop?category=safety-razors',
      imageUrl: '/catagori/WhatsApp Image 2026-08-18 at 12.28.12 AM.jpeg',
      isEnabled: true,
      orderIndex: 5
    },
    {
      sectionKey: 'infinite_gallery',
      title: 'Catalog Visual Showcase',
      subtitle: 'Explore live catalog cards of our handcrafted lash tweezers, professional styling shears, and grooming accessories.',
      badge: 'PREMIUM GALLERY',
      content: '',
      buttonText: '',
      buttonUrl: '',
      imageUrl: '',
      isEnabled: true,
      orderIndex: 6
    },
    {
      sectionKey: 'instagram',
      title: 'Lash Tweezers Lounge @ Instagram',
      subtitle: 'Follow our daily manufacturing stories, client spotlights, and precision testing videos.',
      badge: 'FOLLOW OUR SOCIALS',
      content: '',
      buttonText: 'Follow on Instagram',
      buttonUrl: 'https://www.instagram.com/lash_tweezers_lounge?igsi=dGl5cWUweXp0MDdj&utm_source=qr',
      imageUrl: '',
      isEnabled: true,
      orderIndex: 7
    }
  ];

  for (const sec of defaultSections) {
    await prisma.homepageSection.upsert({
      where: { sectionKey: sec.sectionKey },
      update: {},
      create: sec
    });
  }
  console.log(`✓ Seeded/verified ${defaultSections.length} Homepage Sections`);

  // 4. Brands
  const defaultBrands = [
    { name: 'Lash Tweezers Lounge', slug: 'lash-tweezers-lounge', description: 'Original Master Handcrafted Beauty & Salon Instruments', logo: '/icon.png', isActive: true, orderIndex: 0 },
    { name: 'Cobalt Pro Series', slug: 'cobalt-pro-series', description: 'Japanese 440C Cobalt Steel Barber Shears', logo: '', isActive: true, orderIndex: 1 },
    { name: 'Plasma Diamond Grip', slug: 'plasma-diamond-grip', description: 'Diamond Coated Non-Slip Eyelash Tweezers', logo: '', isActive: true, orderIndex: 2 },
    { name: 'Solingen Master Forged', slug: 'solingen-master-forged', description: 'Ultra-Sharp Cuticle Nippers & Manicure Tools', logo: '', isActive: true, orderIndex: 3 }
  ];

  for (const b of defaultBrands) {
    await prisma.brand.upsert({
      where: { slug: b.slug },
      update: {},
      create: b
    });
  }
  console.log(`✓ Seeded/verified ${defaultBrands.length} Brands`);

  // 5. Pages
  const defaultPages = [
    {
      slug: 'about',
      title: 'About Our Factory & Heritage',
      seoTitle: 'About Our Factory & Heritage | Lash Tweezers Lounge',
      seoDescription: 'Learn about Lash Tweezers Lounge, our manufacturing standards in Sialkot, metallurgical steel selection, and handcrafted instrument precision.',
      template: 'STANDARD',
      isPublished: true,
      content: `### Generational Metallurgical Expertise\n\nHeadquartered in the industrial manufacturing zone of Sialkot, Pakistan, **Lash Tweezers Lounge** blends generational forging knowledge with professional-grade quality standards.\n\nOur company caters to beauty academies, professional lash salons, barber chains, B2B distributors, and private-label cosmetic brands globally. We deliver hand-aligned, custom-engraved tools that artists trust for absolute precision.\n\n### Our Manufacturing Values\n- **100% Hand-Tested Sweet Spots**: Every tweezer is tested under optical magnification to ensure zero light leakage.\n- **Surgical-Grade Alloys**: Japanese 440C Cobalt stainless steel, resistant to autoclave and disinfectant corrosion.\n- **Private Label OEM**: Custom laser engraving, custom packaging, leather pouches, and bespoke tool dimensions.`
    },
    {
      slug: 'contact',
      title: 'Contact Our Export Team',
      seoTitle: 'Contact Us | Lash Tweezers Lounge Customer & B2B Inquiries',
      seoDescription: 'Get in touch with Lash Tweezers Lounge for sample requests, wholesale inquiries, customized OEM production, or retail orders.',
      template: 'CONTACT',
      isPublished: true,
      content: `### We are here to support your salon and brand\n\nWhether you need sample evaluations, wholesale distribution pricing, or custom private label manufacturing, our export team is available around the clock.`
    },
    {
      slug: 'faq',
      title: 'Frequently Asked Questions',
      seoTitle: 'FAQs | Ordering, Shipping & Customization | Lash Tweezers Lounge',
      seoDescription: 'Find answers to common questions regarding our lash tweezers, barber shears, MOQ, custom branding, shipping, and warranty.',
      template: 'STANDARD',
      isPublished: true,
      content: `### Ordering & MOQ\n**Q: What is the Minimum Order Quantity for wholesale?**\nA: For stock catalog items, MOQ starts at 5 pieces. For custom private-label laser engraving and custom colors, MOQ is 20-50 pieces.\n\n**Q: Do you offer sample kits?**\nA: Yes! We provide sample kits for beauty salons and educators to test balance, tension, and sweet-spot grip before placing larger batch orders.\n\n### Shipping & Delivery\n**Q: Which courier services do you use?**\nA: We partner with DHL Express, FedEx Priority, and air cargo for worldwide delivery within 4-7 business days.`
    },
    {
      slug: 'wholesale',
      title: 'Wholesale & OEM Private Label',
      seoTitle: 'Wholesale B2B & OEM Manufacturing | Lash Tweezers Lounge',
      seoDescription: 'Direct manufacturer pricing for beauty academies, salon distributors, and private label lash brands. Custom engraving and packaging.',
      template: 'STANDARD',
      isPublished: true,
      content: `### Direct Manufacturer Pricing for Global Salons & Distributors\n\nLash Tweezers Lounge is a dedicated OEM/ODM manufacturer. We produce premium volume tweezers, isolation clamps, barber shears, and grooming accessories tailored to your exact specifications.\n\n- Custom Laser Logo Marking\n- Titanium Plasma Coating (Gold, Rose Gold, Matte Black, Rainbow, Chameleon, Blue)\n- Custom Luxury Magnetic Box & Leather Pouch Packaging\n- High volume consistency & strict quality control`
    },
    {
      slug: 'shipping',
      title: 'Worldwide Shipping & Delivery Policy',
      seoTitle: 'Shipping & Delivery Information | Lash Tweezers Lounge',
      seoDescription: 'Detailed worldwide delivery timelines, tracking, courier partners, and packaging safety.',
      template: 'POLICY',
      isPublished: true,
      content: `### Global Courier Express Shipping\n\nAll retail and B2B orders are dispatched with protective tip guards, velvet foam pouches, and shock-resistant cartons.\n\n- **Domestic Shipping (Pakistan)**: 2-3 business days via TCS / Leopards.\n- **International Express (USA, UK, Europe, UAE, Australia)**: 4-7 business days via DHL Express / FedEx.`
    },
    {
      slug: 'returns',
      title: 'Returns, Warranty & Exchange Policy',
      seoTitle: 'Returns & Exchange Policy | Lash Tweezers Lounge',
      seoDescription: 'Our 100% satisfaction guarantee and sweet-spot precision warranty.',
      template: 'POLICY',
      isPublished: true,
      content: `### 100% Hand-Aligned Precision Guarantee\n\nIf any tweezer fails to grip 0.03mm - 0.07mm volume lash fans seamlessly or exhibits alignment defects upon arrival, we offer a direct replacement or full refund.`
    },
    {
      slug: 'terms',
      title: 'Terms & Conditions of Service',
      seoTitle: 'Terms of Service | Lash Tweezers Lounge',
      seoDescription: 'Terms and conditions governing orders, payments, and custom manufactured goods.',
      template: 'POLICY',
      isPublished: true,
      content: `### General Conditions\n\nBy accessing or purchasing from Lash Tweezers Lounge, you agree to our standard manufacturing and export terms. Custom OEM orders cannot be cancelled once laser engraving or batch forging commences.`
    },
    {
      slug: 'privacy',
      title: 'Privacy Policy',
      seoTitle: 'Privacy Policy | Lash Tweezers Lounge',
      seoDescription: 'How we protect customer information and transaction details.',
      template: 'POLICY',
      isPublished: true,
      content: `### Customer Data Protection\n\nLash Tweezers Lounge respects your privacy. We never share customer contact information, company designs, or bespoke private label artwork with third parties.`
    }
  ];

  for (const p of defaultPages) {
    await prisma.page.upsert({
      where: { slug: p.slug },
      update: {},
      create: p
    });
  }
  console.log(`✓ Seeded/verified ${defaultPages.length} Static Pages`);

  // 6. Navigation Menu Items
  const menuItems = [
    { title: 'Home', url: '/', menuType: 'MAIN', orderIndex: 0 },
    { title: 'Lash Tweezers', url: '/shop?category=eyelash-tweezers', menuType: 'MAIN', orderIndex: 1 },
    { title: 'Barber Shears', url: '/shop?category=barber-shears', menuType: 'MAIN', orderIndex: 2 },
    { title: 'Grooming & Manicure', url: '/shop?category=cuticle-nippers', menuType: 'MAIN', orderIndex: 3 },
    { title: 'Wholesale / B2B', url: '/wholesale', menuType: 'MAIN', orderIndex: 4 },
    { title: 'About Factory', url: '/about', menuType: 'MAIN', orderIndex: 5 },
    { title: 'Contact', url: '/contact', menuType: 'MAIN', orderIndex: 6 },

    // Footer Company Links
    { title: 'About Lash Tweezers Lounge', url: '/about', menuType: 'FOOTER_COMPANY', orderIndex: 0 },
    { title: 'Returns & Exchanges', url: '/returns', menuType: 'FOOTER_COMPANY', orderIndex: 1 },
    { title: 'Privacy Policy', url: '/privacy', menuType: 'FOOTER_COMPANY', orderIndex: 2 },
    { title: 'Contact Us', url: '/contact', menuType: 'FOOTER_COMPANY', orderIndex: 3 },
    { title: 'FAQs', url: '/faq', menuType: 'FOOTER_COMPANY', orderIndex: 4 },
    { title: 'Terms of Service', url: '/terms', menuType: 'FOOTER_COMPANY', orderIndex: 5 },

    // Footer Info Links
    { title: 'All Instruments Catalog', url: '/shop', menuType: 'FOOTER_INFO', orderIndex: 0 },
    { title: 'Wholesale & OEM Inquiry', url: '/wholesale', menuType: 'FOOTER_INFO', orderIndex: 1 },
    { title: 'Shipping Information', url: '/shipping', menuType: 'FOOTER_INFO', orderIndex: 2 },
    { title: 'TRACK YOUR ORDER', url: '/tracking', menuType: 'FOOTER_INFO', orderIndex: 3 },
    { title: 'Quality Certifications', url: '/certificates', menuType: 'FOOTER_INFO', orderIndex: 4 }
  ];

  const existingMenus = await prisma.menuItem.count();
  if (existingMenus === 0) {
    for (const m of menuItems) {
      await prisma.menuItem.create({ data: m });
    }
    console.log(`✓ Seeded ${menuItems.length} Menu Items`);
  }

  // 7. Populate Media Library from local files
  try {
    const productsDir = path.join(process.cwd(), 'public', 'products');
    const catagoriDir = path.join(process.cwd(), 'public', 'catagori');
    const mediaFiles: { name: string; url: string; size: number }[] = [];

    if (fs.existsSync(productsDir)) {
      const files = fs.readdirSync(productsDir);
      for (const f of files) {
        if (f.match(/\.(jpg|jpeg|png|webp|svg)$/i)) {
          const stats = fs.statSync(path.join(productsDir, f));
          mediaFiles.push({ name: f, url: `/products/${f}`, size: stats.size });
        }
      }
    }

    if (fs.existsSync(catagoriDir)) {
      const files = fs.readdirSync(catagoriDir);
      for (const f of files) {
        if (f.match(/\.(jpg|jpeg|png|webp|svg)$/i)) {
          const stats = fs.statSync(path.join(catagoriDir, f));
          mediaFiles.push({ name: f, url: `/catagori/${f}`, size: stats.size });
        }
      }
    }

    for (const m of mediaFiles) {
      await prisma.media.upsert({
        where: { fileUrl: m.url },
        update: {},
        create: {
          fileName: m.name,
          fileUrl: m.url,
          fileType: 'image',
          fileSize: m.size,
          mimeType: m.name.endsWith('.png') ? 'image/png' : 'image/jpeg',
          altText: m.name.replace(/[-_]/g, ' ')
        }
      });
    }
    console.log(`✓ Synced ${mediaFiles.length} media files into Media Library`);
  } catch (err) {
    console.warn('Media indexing note:', err);
  }

  console.log('--- CMS Database Seeding Complete ---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
