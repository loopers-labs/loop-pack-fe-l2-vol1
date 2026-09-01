'use client';

import Link from 'next/link';
import { useSuspenseQuery } from '@tanstack/react-query';
import { homeQueryOptions } from '@/_pages/home/api/homeQueries';
import type { Product } from '@/entities/product/model/types';
import { ProductCard } from '@/widgets/product-card/ui/ProductCard';
import { NewProductCarousel } from './NewProductCarousel';

interface HomeClientProps {
  scenario?: string;
}

interface ProductSectionProps {
  id: string;
  eyebrow: string;
  title: string;
  products: Product[];
}

function ProductSection({
  id,
  eyebrow,
  title,
  products,
}: ProductSectionProps) {
  return (
    <section aria-labelledby={id} className="py-12 sm:py-16">
      <div className="mb-6 flex items-end justify-between gap-4 sm:mb-8">
        <div>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-neutral-500">
            {eyebrow}
          </p>
          <h2
            id={id}
            className="text-2xl font-bold tracking-[-0.03em] text-neutral-950"
          >
            {title}
          </h2>
        </div>
        <Link
          href="/products"
          className="flex min-h-11 items-center px-1 text-sm font-semibold text-neutral-600 underline-offset-4 hover:text-neutral-950 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950"
        >
          더보기
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-9 sm:grid-cols-3 sm:gap-x-5 lg:grid-cols-4 lg:gap-x-6">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}

export function HomeClient({ scenario }: HomeClientProps) {
  const { data } = useSuspenseQuery(homeQueryOptions(scenario));
  const {
    categories,
    categoryThumbnails,
    popularProducts,
    newProducts,
  } = data;

  const isProductsEmpty =
    popularProducts.length === 0 && newProducts.length === 0;

  return (
    <div className="mx-auto w-full max-w-[1256px] px-4 sm:px-6 lg:px-8">
      <nav aria-label="상품 카테고리" className="py-8 sm:py-10">
        <ul className="grid grid-cols-5 gap-2 sm:gap-4">
          {categories.map((category) => (
            <li key={category.id} className="min-w-0">
              <Link
                href={`/products?category=${category.id}`}
                className="group/category flex min-h-11 flex-col items-center gap-2 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-neutral-950"
              >
                <div className="aspect-square w-full max-w-28 overflow-hidden rounded-lg bg-neutral-100">
                  {categoryThumbnails[category.id] && (
                    <img
                      src={categoryThumbnails[category.id]}
                      alt=""
                      loading="lazy"
                      className="size-full object-cover transition-transform duration-300 group-hover/category:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover/category:scale-100"
                    />
                  )}
                </div>
                <span className="truncate text-xs font-semibold text-neutral-700 group-hover/category:text-neutral-950 sm:text-sm">
                  {category.name}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="border-t border-neutral-200">
        {isProductsEmpty ? (
          <div className="flex min-h-[30vh] items-center justify-center text-center">
            <p className="text-sm text-neutral-600">표시할 상품이 없습니다.</p>
          </div>
        ) : (
          popularProducts.length > 0 && (
            <ProductSection
              id="popular-products-title"
              eyebrow="Popular"
              title="인기 상품"
              products={popularProducts}
            />
          )
        )}

        {!isProductsEmpty && newProducts.length > 0 && (
          <div className="border-t border-neutral-200">
            <NewProductCarousel products={newProducts} />
          </div>
        )}
      </div>
    </div>
  );
}
