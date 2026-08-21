const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const total = await prisma.product.count();
  const allProducts = await prisma.product.findMany({
    select: { id: true, name: true, images: true, productCode: true }
  });

  let multiCount = 0;
  for (const p of allProducts) {
    if (p.images && (p.images.includes(',') || p.images.startsWith('['))) {
      multiCount++;
      console.log(`Product ${p.productCode} (${p.name}) has multiple images:`, p.images);
    }
  }

  console.log('=== Catalog Verification ===');
  console.log('Total Products in Database:', total);
  console.log('Products with Multiple Images:', multiCount);
  console.log('Products with Exactly 1 Image:', total - multiCount);
  console.log('=============================');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
