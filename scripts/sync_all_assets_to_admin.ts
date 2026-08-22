import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Starting fast synchronization of all website assets to Admin Media Library...');

  const mediaItems: Array<{
    fileName: string;
    fileUrl: string;
    fileType: string;
    fileSize: number;
    mimeType: string;
    altText: string;
  }> = [];

  // 1. Scan public/catagori/
  const catagoriDir = path.join(process.cwd(), 'public', 'catagori');
  if (fs.existsSync(catagoriDir)) {
    const catFiles = fs.readdirSync(catagoriDir).filter(f => f.endsWith('.jpeg') || f.endsWith('.jpg') || f.endsWith('.png'));
    console.log(`📁 Found ${catFiles.length} category images in public/catagori/`);
    for (const f of catFiles) {
      const fileUrl = `/catagori/${f}`;
      const stat = fs.statSync(path.join(catagoriDir, f));
      mediaItems.push({
        fileName: f,
        fileUrl,
        fileType: 'image',
        fileSize: stat.size,
        mimeType: 'image/jpeg',
        altText: f.replace(/\.[^/.]+$/, '').replace(/_/g, ' ')
      });
    }
  }

  // 2. Scan public/products/
  const productsDir = path.join(process.cwd(), 'public', 'products');
  if (fs.existsSync(productsDir)) {
    const prodFiles = fs.readdirSync(productsDir).filter(f => f.endsWith('.jpeg') || f.endsWith('.jpg') || f.endsWith('.png'));
    console.log(`📁 Found ${prodFiles.length} product images in public/products/`);
    for (const f of prodFiles) {
      const fileUrl = `/products/${f}`;
      const stat = fs.statSync(path.join(productsDir, f));
      mediaItems.push({
        fileName: f,
        fileUrl,
        fileType: 'image',
        fileSize: stat.size,
        mimeType: 'image/jpeg',
        altText: f.replace(/\.[^/.]+$/, '').replace(/_/g, ' ')
      });
    }
  }

  // Batch insert into Media table
  console.log(`💾 Inserting ${mediaItems.length} total media items in batch...`);
  await prisma.media.createMany({
    data: mediaItems,
    skipDuplicates: true
  });

  // Clean invalid product images
  const products = await prisma.product.findMany({
    select: { id: true, images: true }
  });

  let cleaned = 0;
  for (const prod of products) {
    if (prod.images && prod.images.includes('data:image/jpeg;base64') && !prod.images.includes(',')) {
      await prisma.product.update({
        where: { id: prod.id },
        data: { images: '' }
      });
      cleaned++;
    }
  }

  const total = await prisma.media.count();
  console.log(`✅ Synchronization Complete! ${total} Media items are now active in Admin Media Library.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
