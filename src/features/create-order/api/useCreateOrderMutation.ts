'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { ApiError } from '@/shared/api/response';
import { ORDERS_QUERY_KEY } from '@/entities/order/api/ordersQueryOptions';
import { useCartStore } from '@/entities/cart/model/useCartStore';
import { trackOrderComplete } from '@/analytics/trackEvents';
import type { OrderCreateRequest, OrderCreateResponse } from '@/entities/order/model/order';

const ORDER_FAILED_MESSAGE = '주문하지 못했습니다. 잠시 후 다시 시도해 주세요.';

/**
 * 주문을 만든다.
 *
 * `meta.authRequired`를 붙여 이 요청의 401을 세션 만료로 다루게 한다. 주문은 로그인한
 * 사람만 보낼 수 있는 요청이라, 401이 왔다면 있어야 할 세션이 사라진 것이다.
 */
export function useCreateOrderMutation() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    meta: { authRequired: true },
    mutationFn: async (request: OrderCreateRequest): Promise<OrderCreateResponse> => {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new ApiError(response.status, body?.message ?? ORDER_FAILED_MESSAGE);
      }

      return (await response.json()) as OrderCreateResponse;
    },
    onSuccess: ({ order }) => {
      trackOrderComplete(
        order.id,
        order.items.map((item) => item.productId),
      );
      // 주문한 것과 담긴 것이 어긋나지 않게 비운다. 비우지 않으면 주문서로 다시 들어가
      // 같은 항목을 또 주문할 수 있고 헤더 카운트도 남는다.
      // 위시리스트는 건드리지 않는다 — 구매와 무관한 관심 목록이라 주문했다고 사라질 이유가 없다.
      useCartStore.getState().clearCart();
      queryClient.invalidateQueries({ queryKey: ORDERS_QUERY_KEY });
      router.push('/orders');
    },
  });
}
