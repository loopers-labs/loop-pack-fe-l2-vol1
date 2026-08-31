'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { orderListQueryOptions } from '@/entities/order/api/orderQueries';
import { useProductsByIds } from '@/entities/product/model/useProductsByIds';
import { OrderHistoryCard } from './OrderHistoryCard';

export function OrderHistoryContent() {
  const orderQuery = useQuery(orderListQueryOptions());
  const orders = orderQuery.data?.orders ?? [];
  const productIds = orders.flatMap((order) =>
    order.items.map((item) => item.productId),
  );
  const {
    products,
    isPending: areProductsPending,
    isError: isProductError,
    refetch: refetchProducts,
  } = useProductsByIds(productIds);
  const orderedByNewest = [...orders].reverse();

  if (orderQuery.isPending) {
    return (
      <main
        className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8"
        aria-label="주문 내역을 불러오는 중"
      >
        <div className="h-12 w-48 animate-pulse rounded-lg bg-border/60" />
        <div className="mt-10 space-y-5">
          <div className="h-56 animate-pulse rounded-lg bg-border/50" />
          <div className="h-56 animate-pulse rounded-lg bg-border/50" />
        </div>
      </main>
    );
  }

  if (orderQuery.isError) {
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-3xl items-center px-4 py-16 sm:px-6">
        <div className="w-full border-y border-border bg-bg-card px-6 py-14 text-center">
          <p role="alert" className="text-[14px] text-text-secondary">
            {orderQuery.error.message}
          </p>
          <button
            type="button"
            onClick={() => void orderQuery.refetch()}
            className="mt-6 min-h-11 rounded-lg border border-border px-5 text-sm font-semibold text-text transition-colors hover:border-neutral-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text"
          >
            다시 불러오기
          </button>
        </div>
      </main>
    );
  }

  if (orders.length === 0) {
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-3xl items-center px-4 py-16 sm:px-6">
        <div className="w-full border-y border-border bg-bg-card px-6 py-14 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-caption">
            Orders
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-[-0.04em] text-text">
            아직 주문 내역이 없습니다
          </h1>
          <p className="mt-3 text-[14px] leading-6 text-text-secondary">
            첫 번째 취향을 발견해 보세요.
          </p>
          <Link
            href="/products"
            className="mt-7 inline-flex min-h-12 items-center justify-center rounded-lg bg-text px-6 text-sm font-semibold text-white transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text"
          >
            상품 보러 가기
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-caption">
            Orders
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-[-0.04em] text-text sm:text-4xl">
            주문 내역
          </h1>
          <p className="mt-3 text-[14px] text-text-secondary">
            총 {orders.length}건의 주문이 있습니다.
          </p>
        </div>
        <Link
          href="/orders/new"
          className="inline-flex min-h-11 items-center justify-center rounded-lg border border-border bg-bg-card px-5 text-sm font-semibold text-text transition-colors hover:border-neutral-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text"
        >
          현재 장바구니 주문하기
        </Link>
      </div>

      {isProductError && (
        <div
          role="alert"
          className="mt-8 flex flex-col gap-3 rounded-lg border border-border bg-neutral-50 px-5 py-4 text-[13px] text-text sm:flex-row sm:items-center sm:justify-between"
        >
          <p>일부 주문 상품 정보를 불러오지 못했습니다.</p>
          <button
            type="button"
            onClick={() => void refetchProducts()}
            className="min-h-11 text-left font-semibold underline underline-offset-4 sm:text-right"
          >
            다시 불러오기
          </button>
        </div>
      )}

      <div className="mt-10 space-y-5">
        {orderedByNewest.map((order) => (
          <OrderHistoryCard
            key={order.id}
            order={order}
            products={products}
            isLoading={areProductsPending}
          />
        ))}
      </div>
    </main>
  );
}
