'use client';

import { useInfiniteProducts } from '@/entities/product/model/useInfiniteProducts';
import { InfiniteScrollTrigger } from '@/shared/ui/infinite-scroll-trigger/InfiniteScrollTrigger';
import { ProductCard } from '@/widgets/product-card/ui/ProductCard';
import { ProductCardSkeleton } from '@/widgets/product-card/ui/ProductCardSkeleton';

const CART_FEED_LABELS = {
  loading: '다음 상품을 불러오는 중이에요.',
  error: '다음 상품을 불러오지 못했어요.',
  end: '모든 상품을 확인했어요.',
};

function FeedSkeleton() {
  return (
    <div
      role="status"
      aria-label="전체상품을 불러오는 중"
      className="mt-6 grid grid-cols-2 gap-x-3 gap-y-9 sm:grid-cols-3 sm:gap-x-5 lg:grid-cols-4 lg:gap-x-6"
    >
      {Array.from({ length: 8 }, (_, index) => (
        <ProductCardSkeleton key={index} />
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
    refetch,
    products,
    loadMore,
  } = useInfiniteProducts({ category: 'all', sort: 'latest' });

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
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          <InfiniteScrollTrigger
            hasNextPage={hasNextPage}
            isFetchingNextPage={isFetchingNextPage}
            isNextPageError={isFetchNextPageError}
            onLoadMore={loadMore}
            labels={CART_FEED_LABELS}
          />
        </>
      )}
    </section>
  );
}
