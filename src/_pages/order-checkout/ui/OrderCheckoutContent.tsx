'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createOrder } from '@/entities/order/api/orderService';
import { orderKeys } from '@/entities/order/api/orderQueries';
import { useCartStore } from '@/entities/cart/model/useCartStore';
import {
  getOrderItemCount,
  getOrderTotal,
} from '@/features/order/lib/orderSummary';
import { useProductsByIds } from '@/entities/product/model/useProductsByIds';
import { OrderProductList } from '@/features/order/ui/OrderProductList';
import { BackIcon } from '@/shared/ui/icons/BackIcon';
import { protectedRequestMeta } from '@/shared/api/requestMeta';
import { OrderPaymentSummary } from './OrderPaymentSummary';

export function OrderCheckoutContent() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const cartItems = useCartStore((state) => state.items);
  const clearItems = useCartStore((state) => state.clearItems);
  const isCartHydrated = useCartStore((state) => state.isHydrated);

  const items = Array.from(cartItems.values(), ({ id, quantity }) => ({
    productId: id,
    quantity,
  }));
  const { products, isPending, isError, refetch } = useProductsByIds(
    items.map((item) => item.productId),
  );
  const itemCount = getOrderItemCount(items);
  const total = getOrderTotal(items, products);
  const isOrderReady =
    items.length > 0 &&
    !isPending &&
    !isError &&
    products.size === items.length;
  const orderMutation = useMutation({
    mutationFn: () => createOrder({ items }),
    meta: protectedRequestMeta,
    onSuccess: async () => {
      clearItems();
      await queryClient.invalidateQueries({ queryKey: orderKeys.all });
      router.replace('/orders');
    },
  });
  const orderErrorMessage = orderMutation.error?.message;

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    orderMutation.mutate();
  };

  if (!isCartHydrated) {
    return (
      <main
        className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8"
        aria-label="주문서를 불러오는 중"
      >
        <div className="h-12 w-40 animate-pulse rounded-lg bg-border/60" />
        <div className="mt-10 h-72 animate-pulse rounded-lg bg-border/50" />
      </main>
    );
  }

  if (items.length === 0) {
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-3xl items-center px-4 py-16 sm:px-6">
        <div className="w-full border-y border-border bg-bg-card px-6 py-14 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-caption">
            Order
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-[-0.04em] text-text">
            주문할 상품이 없습니다
          </h1>
          <p className="mt-3 text-[14px] leading-6 text-text-secondary">
            마음에 드는 상품을 장바구니에 담아주세요.
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
      <Link
        href="/products"
        className="inline-flex min-h-11 items-center gap-2 rounded-sm pr-3 text-sm font-medium text-text-secondary transition-colors hover:text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text"
      >
        <BackIcon />
        쇼핑 계속하기
      </Link>

      <div className="mt-5">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-caption">
          Checkout
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-[-0.04em] text-text sm:text-4xl">
          주문서
        </h1>
        <p className="mt-3 text-[14px] text-text-secondary">
          {itemCount}개의 상품과 결제 금액을 확인해 주세요.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="mt-10 grid items-start gap-6 md:grid-cols-[minmax(0,1fr)_320px]"
      >
        <section
          aria-labelledby="order-products-title"
          className="rounded-lg border border-border bg-bg-card p-5 sm:p-8"
        >
          <div className="mb-6 flex items-center justify-between gap-4">
            <h2
              id="order-products-title"
              className="text-2xl font-bold tracking-[-0.03em] text-text"
            >
              주문 상품
            </h2>
            <span className="text-[13px] text-text-secondary">
              총 {itemCount}개
            </span>
          </div>

          <OrderProductList
            items={items}
            products={products}
            isLoading={isPending}
          />

          {isError && (
            <div
              role="alert"
              className="mt-6 rounded-lg border border-border bg-neutral-50 px-4 py-4 text-[13px] leading-5 text-text"
            >
              <p>일부 상품 정보를 불러오지 못했습니다.</p>
              <button
                type="button"
                onClick={() => void refetch()}
                className="mt-2 min-h-11 font-semibold underline underline-offset-4"
              >
                다시 불러오기
              </button>
            </div>
          )}
        </section>

        <OrderPaymentSummary
          itemCount={itemCount}
          total={total}
          isPending={orderMutation.isPending}
          isReady={isOrderReady}
          errorMessage={orderErrorMessage}
        />
      </form>
    </main>
  );
}
