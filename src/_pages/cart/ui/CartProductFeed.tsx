'use client';

import { useCallback } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { productListInfiniteQueryOptions } from '@/entities/product/api/productQueries';
import type { Product } from '@/entities/product/model/types';
import { CartProductCard } from './CartProductCard';

function mergeProducts(pages: { products: Product[] }[]): Product[] {
  const productsById = new Map<string, Product>();

  pages.forEach((page) => {
    page.products.forEach((product) => productsById.set(product.id, product));
  });

  return Array.from(productsById.values());
}

function FeedSkeleton() {
  return (
    <div
      aria-label="전체상품을 불러오는 중"
      className="mt-6 grid grid-cols-2 gap-x-3 gap-y-9 sm:grid-cols-3 sm:gap-x-5 lg:grid-cols-4 lg:gap-x-6"
    >
      {Array.from({ length: 8 }, (_, index) => (
        <div key={index} className="animate-pulse motion-reduce:animate-none">
          <div className="aspect-square rounded-lg bg-border/50" />
          <div className="mt-3 h-3 w-1/3 rounded bg-border/50" />
          <div className="mt-2 h-10 rounded bg-border/50" />
          <div className="mt-2 h-4 w-1/2 rounded bg-border/50" />
        </div>
      ))}
    </div>
  );
}

export function CartProductFeed() {
  const {
    data,
    isError,
    isFetchingNextPage,
    isFetchNextPageError,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useInfiniteQuery(
    productListInfiniteQueryOptions({ category: 'all', sort: 'latest' }),
  );

  const handleLoadMore = useCallback(() => {
    if (!hasNextPage || isFetchingNextPage) return;
    void fetchNextPage();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  if (isError && !data) {
    return (
      <section aria-labelledby="cart-products-title" className="mt-16 sm:mt-20">
        <h2 id="cart-products-title" className="text-2xl font-bold tracking-[-0.03em] text-text">
          전체상품
        </h2>
        <div className="flex min-h-48 flex-col items-center justify-center gap-3 text-center">
          <p role="alert" className="text-sm text-text-secondary">
            상품을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.
          </p>
          <button
            type="button"
            onClick={() => void refetch()}
            className="min-h-11 cursor-pointer rounded-lg border border-border px-5 text-sm font-semibold text-text transition-colors hover:border-neutral-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text"
          >
            다시 시도
          </button>
        </div>
      </section>
    );
  }

  return (
    <section aria-labelledby="cart-products-title" className="mt-16 sm:mt-20">
      <div className="flex items-end justify-between gap-4 border-b border-border pb-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-caption">
            Explore
          </p>
          <h2
            id="cart-products-title"
            className="mt-2 text-2xl font-bold tracking-[-0.03em] text-text sm:text-3xl"
          >
            전체상품
          </h2>
        </div>
        {data && (
          <p className="shrink-0 text-sm tabular-nums text-text-caption">
            총 {data.pages[0]?.totalCount ?? 0}개
          </p>
        )}
      </div>

      {!data ? (
        <FeedSkeleton />
      ) : (
        <>
          <div className="mt-6 grid grid-cols-2 gap-x-3 gap-y-10 sm:grid-cols-3 sm:gap-x-5 lg:grid-cols-4 lg:gap-x-6">
            {mergeProducts(data.pages).map((product) => (
              <CartProductCard key={product.id} product={product} />
            ))}
          </div>

          <div className="mt-10 flex min-h-20 items-center justify-center text-center">
            {isFetchingNextPage ? (
              <p role="status" className="text-sm text-text-secondary">
                다음 상품을 불러오는 중이에요.
              </p>
            ) : isFetchNextPageError ? (
              <div>
                <p role="alert" className="text-sm text-text-secondary">
                  다음 상품을 불러오지 못했어요.
                </p>
                <button
                  type="button"
                  onClick={handleLoadMore}
                  className="mt-3 min-h-11 cursor-pointer rounded-lg border border-border px-5 text-sm font-semibold text-text transition-colors hover:border-neutral-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text"
                >
                  다시 시도
                </button>
              </div>
            ) : hasNextPage ? (
              <LoadMoreTrigger onLoadMore={handleLoadMore} />
            ) : (
              <p role="status" className="text-sm text-text-caption">
                모든 상품을 확인했어요.
              </p>
            )}
          </div>
        </>
      )}
    </section>
  );
}

interface LoadMoreTriggerProps {
  onLoadMore: () => void;
}

function LoadMoreTrigger({ onLoadMore }: LoadMoreTriggerProps) {
  const triggerRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (!node || typeof IntersectionObserver === 'undefined') return;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry?.isIntersecting) onLoadMore();
        },
        { rootMargin: '240px 0px' },
      );

      observer.observe(node);
      return () => observer.disconnect();
    },
    [onLoadMore],
  );

  return (
    <div ref={triggerRef}>
      <button
        type="button"
        onClick={onLoadMore}
        className="min-h-11 cursor-pointer rounded-lg border border-border px-5 text-sm font-semibold text-text transition-colors hover:border-neutral-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text"
      >
        더 보기
      </button>
    </div>
  );
}
