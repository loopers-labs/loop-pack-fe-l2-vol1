'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCartItems, useClearCart } from '@/entities/cart';
import { createOrder, orderQueries } from '@/entities/order';
import { analyticsEvents } from '@/shared/analytics/events';
import { UnauthorizedError } from '@/shared/api/errors';

// 주문서. 카트에는 상품 id만 있고 수량이 없으므로 수량 1로 주문한다 (RFC D3 — 카트 모델 변경은 범위 밖).
// 주문 API 응답에 금액이 없고 이 화면도 금액을 보여주지 않는다.
export function CheckoutPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const items = useCartItems();
  const clearCart = useClearCart();

  // 주문 시작 = 담은 상품이 있는 주문서에 들어온 것. 빈 주문서는 시작이 아니다 (RFC A절).
  const itemCount = items.length;
  useEffect(() => {
    if (itemCount > 0) analyticsEvents.orderStart(itemCount);
  }, [itemCount]);

  const { mutate, isPending, error } = useMutation({
    mutationFn: createOrder,
    // 401은 이 화면이 아니라 (commerce) 경계가 처리한다 (RFC D5).
    throwOnError: (mutationError) => mutationError instanceof UnauthorizedError,
    onSuccess: async (order) => {
      analyticsEvents.orderComplete(order.id, order.items.length);
      clearCart();
      await queryClient.invalidateQueries(orderQueries.list());
      router.push('/orders');
    },
  });

  const placeOrder = () =>
    mutate({ items: items.map((productId) => ({ productId, quantity: 1 })) });

  return (
    <main>
      <section className="week05-section">
        <h1>주문서</h1>
        {items.length === 0 ? (
          <p>
            담긴 상품이 없어요. <Link href="/products">상품 보러 가기</Link>
          </p>
        ) : (
          <>
            <p>담은 상품 {items.length}개 (각 1개씩 주문)</p>
            <ul aria-label="주문 상품">
              {items.map((productId) => (
                <li key={productId}>{productId}</li>
              ))}
            </ul>
            {error ? <p role="alert">{error.message}</p> : null}
            <button type="button" disabled={isPending} onClick={placeOrder}>
              {isPending ? '주문 중…' : '주문하기'}
            </button>
          </>
        )}
      </section>
    </main>
  );
}
