'use client';

import { useCallback } from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { homeQueryOptions } from '@/queries/homeQueries';
import { productListQueryOptions } from '@/queries/productQueries';
import { useWishlistStore } from '@/store/wishlistStore';
import { useCartStore } from '@/store/cartStore';
import { formatWon, calcDiscount } from '@/utils/format';
import type { Product } from '@/types/commerce';

function ProductCard({ product }: { product: Product }) {
  const isWished = useWishlistStore((s) => s.ids.has(product.id));
  const toggle = useWishlistStore((s) => s.toggle);
  const addItem = useCartStore((s) => s.addItem);

  return (
    <article className="group">
      <Link href={`/products/${product.id}`}>
        <div className="relative aspect-square overflow-hidden rounded-2xl bg-bg">
          <img
            src={product.image}
            alt={product.name}
            className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          {product.originalPrice && (
            <div className="absolute left-3 top-3">
              <span className="rounded-full bg-discount px-2.5 py-1 text-[11px] font-bold text-white shadow-sm">
                -{calcDiscount(product.originalPrice, product.price)}%
              </span>
            </div>
          )}
        </div>
        <div className="mt-3.5 px-0.5">
          <span className="text-[11px] font-medium uppercase tracking-wider text-text-caption">
            {product.brand}
          </span>
          <h3 className="mt-1 truncate text-[14px] font-medium text-text">
            {product.name}
          </h3>
          <p className="mt-1.5 text-[15px] font-semibold text-text">
            {formatWon(product.price)}
          </p>
          {product.originalPrice && (
            <p className="text-[12px] text-text-caption line-through">
              {formatWon(product.originalPrice)}
            </p>
          )}
        </div>
      </Link>
      <div className="mt-2 flex gap-2 px-0.5">
        <button
          type="button"
          onClick={() => toggle(product.id)}
          className={`rounded-lg border px-3 py-1 text-xs transition-colors ${
            isWished
              ? 'border-accent text-accent'
              : 'border-border text-text-secondary hover:bg-bg'
          }`}
        >
          {isWished ? '찜 해제' : '찜'}
        </button>
        <button
          type="button"
          onClick={() =>
            addItem({
              id: product.id,
              name: product.name,
              image: product.image,
              price: product.price,
            })
          }
          className="rounded-lg border border-border px-3 py-1 text-xs text-text-secondary transition-colors hover:bg-bg"
        >
          담기
        </button>
      </div>
    </article>
  );
}

export function HomeClient() {
  const queryClient = useQueryClient();
  const { data, isLoading, isError, error } = useQuery(homeQueryOptions());

  const prefetchProducts = useCallback(() => {
    void queryClient.prefetchQuery(
      productListQueryOptions({ category: 'all', sort: 'latest', page: 1 }),
    );
  }, [queryClient]);

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="size-8 animate-spin rounded-full border-2 border-border border-t-brand" />
          <p className="text-sm text-text-secondary">불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-sm text-text-secondary">
          {error?.message ?? '오류가 발생했습니다.'}
        </p>
      </div>
    );
  }

  if (!data) return null;

  const { banner, categories, categoryThumbnails, popularProducts, newProducts } = data;

  const isProductsEmpty = popularProducts.length === 0 && newProducts.length === 0;

  return (
    <>
      {/* 배너 */}
      <section className="relative overflow-hidden bg-bg-card">
        <div className="relative h-[420px] md:h-[520px]">
          <img
            src={banner.image}
            alt=""
            className="absolute inset-0 size-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-text/60 via-text/30 to-transparent" />
          <div className="relative mx-auto flex h-full max-w-5xl items-center px-8">
            <div className="max-w-lg">
              <h2 className="font-family-display text-3xl font-light text-white md:text-[42px] md:leading-[1.2]">
                {banner.title}
              </h2>
              <p className="mt-4 text-[14px] leading-relaxed text-white/80">
                {banner.description}
              </p>
              <Link
                href="/products"
                className="mt-7 inline-flex h-11 items-center rounded-lg bg-white px-6 text-[13px] font-semibold text-text transition-colors hover:bg-white/90"
                onMouseEnter={prefetchProducts}
              >
                Shop Now
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 카테고리 */}
      <section className="mx-auto max-w-5xl px-8 py-14">
        <h2 className="mb-8 font-family-display text-xl font-normal text-text">
          Shop by Categories
        </h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
          {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/products?category=${cat.id}`}
                className="group flex flex-col items-center gap-3"
              >
                <div className="aspect-square w-full overflow-hidden rounded-xl bg-bg">
                  {categoryThumbnails[cat.id] && (
                    <img
                      src={categoryThumbnails[cat.id]}
                      alt={cat.name}
                      className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  )}
                </div>
                <span className="text-[13px] font-medium text-text-secondary transition-colors group-hover:text-text">
                  {cat.name}
                </span>
              </Link>
          ))}
        </div>
      </section>

      {/* 인기 상품 */}
      {isProductsEmpty ? (
        <div className="flex min-h-[30vh] items-center justify-center">
          <p className="text-sm text-text-secondary">표시할 상품이 없습니다.</p>
        </div>
      ) : popularProducts.length > 0 && (
        <section className="bg-bg-card py-14">
          <div className="mx-auto max-w-5xl px-8">
            <h2 className="mb-8 font-family-display text-xl font-normal text-text">
              인기 상품
            </h2>
            <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:gap-8">
              {popularProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 신상품 */}
      {!isProductsEmpty && newProducts.length > 0 && (
        <section className="mx-auto max-w-5xl px-8 py-14">
          <h2 className="mb-8 font-family-display text-xl font-normal text-text">
            신상품
          </h2>
          <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:gap-8">
            {newProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
