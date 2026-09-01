'use client';

import { useInfiniteProducts } from '@/entities/product/model/useInfiniteProducts';
import { useProductSearchParams } from '../lib/useProductSearchParams';
import { ProductListFilters } from './ProductListFilters';
import { ProductListIntro } from './ProductListIntro';
import { ProductListSkeleton } from './ProductListSkeleton';
import { InfiniteScrollTrigger } from '@/shared/ui/infinite-scroll-trigger/InfiniteScrollTrigger';
import { ProductCard } from '@/widgets/product-card/ui/ProductCard';
import type { Product } from '@/entities/product/model/types';

interface ProductGridProps {
  products: Product[];
  totalCount: number;
  isRefreshing: boolean;
  isStale: boolean;
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
            <ProductCard
              key={product.id}
              product={product}
              headingLevel={2}
            />
          ))}
        </div>
      )}
    </>
  );
}

export function ProductListContent() {
  const { params, query, setCategory, setSort, setSearch } =
    useProductSearchParams();
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

  const handleRetry = () => {
    void refetch();
  };

  if (isError && !data) {
    return (
      <main className="mx-auto min-h-screen w-full max-w-[1256px] px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
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
    <main className="mx-auto min-h-screen w-full max-w-[1256px] px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
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

      <ProductListFilters
        searchQuery={params.q}
        category={params.category}
        sort={params.sort}
        categories={firstPage.categories}
        onSearchChange={setSearch}
        onCategoryChange={setCategory}
        onSortChange={setSort}
      />

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
