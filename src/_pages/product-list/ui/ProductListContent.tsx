'use client';

import { useCallback, useEffect, useRef } from 'react';
import Link from 'next/link';
import { getProductDiscount } from '@/entities/product/lib/productPricing';
import { useInfiniteProducts } from '@/entities/product/model/useInfiniteProducts';
import { useWishlistStore } from '@/entities/wishlist/model/wishlistStore';
import { useCartStore } from '@/entities/cart/model/useCartStore';
import { useProductSearchParams } from '../lib/useProductSearchParams';
import { formatWon } from '@/shared/lib/format';
import { ProductListIntro } from './ProductListIntro';
import { ProductListSkeleton } from './ProductListSkeleton';
import { InfiniteScrollTrigger } from '@/shared/ui/infinite-scroll-trigger/InfiniteScrollTrigger';
import type {
  CategoryOption,
  Product,
  ProductSort,
} from '@/entities/product/model/types';

function ProductActions({ product }: { product: Product }) {
  const isWished = useWishlistStore((state) => state.ids.has(product.id));
  const toggle = useWishlistStore((state) => state.toggle);
  const addItem = useCartStore((state) => state.addItem);

  return (
    <div className="mt-2 flex gap-2">
      <button
        type="button"
        onClick={() => toggle(product.id)}
        className={`flex min-h-11 flex-1 items-center justify-center rounded-lg border px-3 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text ${
          isWished
            ? 'border-accent text-accent'
            : 'border-border text-text-secondary hover:border-neutral-400 hover:text-text'
        }`}
      >
        {isWished ? '찜 해제' : '찜'}
      </button>
      <button
        type="button"
        onClick={() => addItem(product.id)}
        className="flex min-h-11 flex-1 items-center justify-center rounded-lg border border-border px-3 text-xs font-semibold text-text-secondary transition-colors hover:border-neutral-400 hover:text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text"
      >
        담기
      </button>
    </div>
  );
}

interface ProductGridProps {
  products: Product[];
  totalCount: number;
  isRefreshing: boolean;
  isStale: boolean;
}

function ProductListPrice({ product }: { product: Product }) {
  const discount = getProductDiscount(product);

  return (
    <>
      <strong className="mt-2 block text-base font-bold tracking-[-0.02em] text-text">
        {formatWon(product.price)}
      </strong>
      {discount && (
        <span className="mt-0.5 block text-xs text-text-caption line-through">
          {formatWon(discount.originalPrice)}
        </span>
      )}
    </>
  );
}

function ProductGrid({
  products,
  totalCount,
  isRefreshing,
  isStale,
}: ProductGridProps) {
  return (
    <>
      <p className="mt-8 text-sm text-text-caption" aria-live="polite">
        총 {totalCount}개
        {isRefreshing && (
          <span className="ml-2 text-text-caption">불러오는 중...</span>
        )}
      </p>

      {products.length === 0 ? (
        <div className="flex min-h-[30vh] items-center justify-center">
          <p className="text-sm text-text-secondary">상품이 없습니다.</p>
        </div>
      ) : (
        <div
          className={`mt-4 grid grid-cols-2 gap-x-3 gap-y-9 transition-opacity sm:grid-cols-3 sm:gap-x-5 lg:grid-cols-4 lg:gap-x-6 ${isStale ? 'pointer-events-none opacity-50' : ''}`}
        >
          {products.map((product) => (
            <article key={product.id} className="group">
              <Link
                href={`/products/${product.id}`}
                className="block rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-text"
              >
                <div className="aspect-square overflow-hidden rounded-lg bg-neutral-100">
                  <img
                    src={product.image}
                    alt={product.name}
                    loading="lazy"
                    className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                  />
                </div>
                <div className="pt-3">
                  <p className="truncate text-xs font-medium text-text-caption">
                    {product.brand}
                  </p>
                  <h2 className="mt-1 line-clamp-2 min-h-10 text-sm leading-5 text-text transition-colors group-hover:text-text-secondary sm:text-[15px]">
                    {product.name}
                  </h2>
                  <ProductListPrice product={product} />
                </div>
              </Link>
              <ProductActions product={product} />
            </article>
          ))}
        </div>
      )}
    </>
  );
}

export function ProductListContent() {
  const { params, query, setCategory, setSort, setSearch } =
    useProductSearchParams();
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const inputRef = useRef<HTMLInputElement>(null);
  const {
    data,
    isError,
    isFetching,
    isFetchingNextPage,
    isFetchNextPageError,
    isPlaceholderData,
    isShowingFallback,
    hasNextPage,
    refetch,
    products,
    loadMore,
  } = useInfiniteProducts(query, { shouldKeepPreviousData: true });

  useEffect(() => {
    if (inputRef.current && inputRef.current !== document.activeElement) {
      inputRef.current.value = params.q ?? '';
    }
  }, [params.q]);

  const handleRetry = useCallback(() => {
    void refetch();
  }, [refetch]);

  const handleSearchChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setSearch(value);
      }, 300);
    },
    [setSearch],
  );

  if (isError && !data) {
    return (
      <main className="min-h-screen px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <ProductListIntro />
        <div className="flex min-h-[30vh] items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <p role="alert" className="text-sm text-text-secondary">
              상품을 불러오지 못했습니다.
            </p>
            <button
              type="button"
              onClick={handleRetry}
              className="min-h-11 text-[13px] font-medium text-brand underline underline-offset-4 transition-colors hover:text-brand/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text"
            >
              다시 시도
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (!data) return <ProductListSkeleton />;

  const firstPage = data.pages[0];
  return (
    <main className="min-h-screen px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <ProductListIntro />

      {isShowingFallback && (
        <div className="mt-6 flex items-center justify-between rounded-lg border border-border bg-neutral-50 px-4 py-3">
          <p role="alert" className="text-sm text-text-secondary">
            목록을 갱신하지 못했습니다.
          </p>
          <button
            type="button"
            onClick={handleRetry}
            className="min-h-11 text-[13px] font-medium text-brand underline underline-offset-4 transition-colors hover:text-brand/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text"
          >
            다시 시도
          </button>
        </div>
      )}

      <div className="mt-8 flex flex-col gap-3 border-y border-border py-5 sm:flex-row sm:flex-wrap">
        <label className="min-w-0 flex-1 sm:min-w-64">
          <span className="sr-only">상품 검색</span>
          <input
            ref={inputRef}
            type="text"
            placeholder="상품명 또는 브랜드"
            defaultValue={params.q}
            onChange={handleSearchChange}
            className="min-h-11 w-full rounded-lg border border-border bg-bg-card px-4 text-sm text-text outline-none transition-colors placeholder:text-text-caption focus:border-text"
          />
        </label>
        <label>
          <span className="sr-only">카테고리</span>
          <select
            value={params.category}
            onChange={(event) =>
              setCategory(event.target.value as CategoryOption)
            }
            className="min-h-11 w-full rounded-lg border border-border bg-bg-card px-4 text-sm text-text outline-none transition-colors focus:border-text sm:w-auto"
          >
            <option value="all">전체</option>
            {firstPage.categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="sr-only">정렬</span>
          <select
            value={params.sort}
            onChange={(event) => setSort(event.target.value as ProductSort)}
            className="min-h-11 w-full rounded-lg border border-border bg-bg-card px-4 text-sm text-text outline-none transition-colors focus:border-text sm:w-auto"
          >
            <option value="latest">최신순</option>
            <option value="popular">인기순</option>
            <option value="price-asc">가격 낮은순</option>
            <option value="price-desc">가격 높은순</option>
          </select>
        </label>
      </div>

      <ProductGrid
        products={products}
        totalCount={firstPage.totalCount}
        isRefreshing={isFetching && !isFetchingNextPage}
        isStale={isPlaceholderData || isShowingFallback}
      />
      {products.length > 0 && (
        <InfiniteScrollTrigger
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          isNextPageError={isFetchNextPageError}
          onLoadMore={loadMore}
        />
      )}
    </main>
  );
}
