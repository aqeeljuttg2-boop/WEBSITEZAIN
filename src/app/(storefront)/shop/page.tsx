import React from 'react';
import db from '@/lib/db';
import ProductCard from '@/components/ProductCard';
import Link from 'next/link';
import SearchFilterWrapper from './SearchFilterWrapper';

import { Metadata } from 'next';

export const dynamic = 'force-dynamic';
export const revalidate = 0; // Fresh DB fetches

interface ShopPageProps {
  searchParams: Promise<{
    category?: string;
    search?: string;
    minPrice?: string;
    maxPrice?: string;
    material?: string;
    finish?: string;
    moq?: string;
    sort?: string;
    page?: string;
  }>;
}

export async function generateMetadata({ searchParams }: ShopPageProps): Promise<Metadata> {
  const params = await searchParams;
  const categorySlug = params.category;
  
  let title = 'Shop Beauty & Grooming Instruments Catalog';
  let description = 'Browse precision eyelash extension tweezers, barber shears, cuticle nippers, and grooming tools by Lash Tweezers Lounge.';

  if (categorySlug) {
    const category = await db.category.findUnique({
      where: { slug: categorySlug }
    });
    if (category) {
      title = `${category.name} | Lash Tweezers Lounge Catalog`;
      description = category.description || `Explore handcrafted ${category.name} from Lash Tweezers Lounge.`;
    }
  }

  return {
    title,
    description,
    openGraph: {
      title: `${title} | Lash Tweezers Lounge`,
      description,
    }
  };
}

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const params = await searchParams;
  const categorySlug = params.category || '';
  const search = params.search || '';
  const minPrice = parseFloat(params.minPrice || '0');
  const maxPrice = parseFloat(params.maxPrice || '100000');
  const material = params.material || '';
  const finish = params.finish || '';
  const sort = params.sort || 'newest';
  const page = parseInt(params.page || '1', 10);
  const limit = 15;
  const skip = (page - 1) * limit;

  // 1. Build Prisma query filters
  const where: any = { status: 'ACTIVE' };

  if (categorySlug) {
    where.OR = [
      { category: { slug: categorySlug } },
      { category: { id: categorySlug } },
      { category: { parent: { slug: categorySlug } } },
      { category: { parent: { id: categorySlug } } }
    ];
  }

  if (search) {
    const searchCondition = [
      { name: { contains: search } },
      { productCode: { contains: search } },
      { sku: { contains: search } },
      { description: { contains: search } },
      { material: { contains: search } },
      { finish: { contains: search } },
    ];
    if (where.OR) {
      where.AND = [
        { OR: where.OR },
        { OR: searchCondition }
      ];
      delete where.OR;
    } else {
      where.OR = searchCondition;
    }
  }

  where.singlePrice = {
    gte: minPrice,
    lte: maxPrice,
  };

  if (material) {
    where.material = { contains: material };
  }

  if (finish) {
    where.finish = { contains: finish };
  }

  // 2. Sorting
  let orderBy: any = { createdAt: 'desc' };
  if (sort === 'price-asc') {
    orderBy = { singlePrice: 'asc' };
  } else if (sort === 'price-desc') {
    orderBy = { singlePrice: 'desc' };
  } else if (sort === 'name-asc') {
    orderBy = { name: 'asc' };
  } else if (sort === 'name-desc') {
    orderBy = { name: 'desc' };
  } else if (sort === 'popular') {
    orderBy = { stock: 'desc' };
  }

  // 3. Database Queries safely
  let products: any[] = [];
  let total = 0;
  let activeCategory: any = null;
  let categoriesList: any[] = [];

  try {
    const [prods, tot, actCat, catList] = await Promise.all([
      db.product.findMany({
        where,
        include: {
          category: true,
          pricingTiers: {
            orderBy: { minQuantity: 'asc' }
          }
        },
        orderBy,
        skip,
        take: limit,
      }),
      db.product.count({ where }),
      categorySlug
        ? db.category.findFirst({
            where: {
              OR: [
                { slug: categorySlug },
                { id: categorySlug }
              ]
            },
            include: { subcategories: true }
          })
        : Promise.resolve(null),
      db.category.findMany({
        where: { parentId: null, isActive: true },
        include: {
          subcategories: {
            where: { isActive: true },
            orderBy: { orderIndex: 'asc' }
          }
        },
        orderBy: { orderIndex: 'asc' }
      })
    ]);

    products = prods;
    total = tot;
    activeCategory = actCat;
    categoriesList = catList;
  } catch (err) {
    console.error('ShopPage DB Error:', err);
  }

  const pages = Math.ceil(total / limit);

  // Dynamic heading & description
  const pageTitle = activeCategory ? activeCategory.name : (search ? `Search results for "${search}"` : 'All Beauty Instruments');
  const pageDesc = activeCategory?.description || 'Browse our handcrafted volume lash tweezers, barber shears, manicure sets, and safety razors.';

  return (
    <div className="w-full bg-gray-50 min-h-[calc(100vh-200px)] py-10">
      <div className="max-w-7xl mx-auto px-4 text-gray-800">
        {/* Header & Breadcrumbs */}
      <div className="flex flex-col space-y-3 mb-8 bg-white border border-gray-200 p-6 md:p-8 rounded-2xl shadow-sm">
        <div className="text-xs uppercase tracking-widest font-mono text-[#C21875] flex items-center space-x-2">
          <Link href="/" className="hover:underline">Home</Link>
          <span className="text-gray-400">/</span>
          <Link href="/shop" className="hover:underline">Catalog</Link>
          {activeCategory && (
            <>
              <span className="text-gray-400">/</span>
              <span className="text-gray-600 font-bold">{activeCategory.name}</span>
            </>
          )}
        </div>
        <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight text-gray-900">{pageTitle}</h1>
        <p className="text-sm text-gray-500 max-w-2xl">
          {pageDesc}
        </p>
        <p className="text-xs text-[#C21875] font-semibold">
          Showing {products.length} of {total} products
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* LEFT: Sidebar Filters */}
        <div className="lg:col-span-1 bg-white border border-gray-200 p-6 rounded-2xl shadow-sm space-y-6 sticky top-24">
          <SearchFilterWrapper 
            categories={categoriesList}
            currentCategory={categorySlug}
            currentSearch={search}
            currentMinPrice={params.minPrice || ''}
            currentMaxPrice={params.maxPrice || ''}
            currentMaterial={material}
            currentFinish={finish}
            currentMoq={params.moq || ''}
            currentSort={sort}
          />
        </div>

        {/* RIGHT: Product Grid & Sorting */}
        <div className="lg:col-span-3 space-y-8">
          
          {products.length === 0 ? (
            <div className="text-center py-20 bg-white border border-gray-200 rounded-2xl shadow-sm space-y-4">
              <p className="text-lg font-bold text-gray-800">No products match your active filters.</p>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                Try searching with different terms or reset your filters to view our full instrument range.
              </p>
              <div>
                <Link 
                  href="/shop" 
                  className="inline-block bg-[#C21875] hover:bg-[#A31260] text-white text-xs font-bold uppercase tracking-wider px-6 py-3 rounded-full shadow-md transition-colors"
                >
                  View All Products
                </Link>
              </div>
            </div>
          ) : (
            <>
              {/* Product Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {products.map((prod: any) => (
                  <ProductCard key={prod.id} product={prod} />
                ))}
              </div>

              {/* Pagination */}
              {pages > 1 && (
                <div className="flex justify-center items-center space-x-2 pt-6">
                  {[...Array(pages)].map((_, i) => {
                    const pageNum = i + 1;
                    const isActive = pageNum === page;
                    
                    const qParams = new URLSearchParams();
                    if (categorySlug) qParams.set('category', categorySlug);
                    if (search) qParams.set('search', search);
                    if (params.minPrice) qParams.set('minPrice', params.minPrice);
                    if (params.maxPrice) qParams.set('maxPrice', params.maxPrice);
                    if (material) qParams.set('material', material);
                    if (finish) qParams.set('finish', finish);
                    if (sort) qParams.set('sort', sort);
                    qParams.set('page', pageNum.toString());

                    return (
                      <Link
                        key={pageNum}
                        href={`/shop?${qParams.toString()}`}
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs border transition-all ${
                          isActive 
                            ? 'bg-[#C21875] border-[#C21875] text-white shadow-md' 
                            : 'bg-white border-gray-200 hover:border-[#C21875] text-gray-700 hover:text-[#C21875]'
                        }`}
                      >
                        {pageNum}
                      </Link>
                    );
                  })}
                </div>
              )}
            </>
          )}

        </div>
      </div>
      </div>
    </div>
  );
}
