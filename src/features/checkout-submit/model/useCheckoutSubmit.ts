'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { createOrder } from '@/entities/order/api/orders';
import { ordersQueries } from '@/entities/order/api/ordersQueries';
import { useCartStore } from '@/entities/cart/model/cartStore';
import { sessionQueries } from '@/entities/session/api/sessionQueries';
import type { AuthUser } from '@/entities/session/model';
import { ApiError } from '@/shared/api';
import { track } from '@/analytics/logger';

export function useCheckoutSubmit() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const items = useCartStore((state) => state.items);
  const removeItem = useCartStore((state) => state.removeItem);

  const mutation = useMutation({
    // cartStore는 상품 id만 저장하고 수량 개념이 없어, 수량은 항상 1로 보낸다.
    mutationFn: () =>
      createOrder(items.map((productId) => ({ productId, quantity: 1 }))),
    onSuccess: () => {
      // /orders/new는 보호 경로라 이 시점엔 항상 로그인 상태이므로 user는 사실상 항상 존재한다.
      const user = queryClient.getQueryData<AuthUser | null>(
        sessionQueries.me().queryKey,
      );
      track('order_complete', { productIds: items, userId: user?.id });
      items.forEach((productId) => removeItem(productId));
      void queryClient.invalidateQueries({ queryKey: ordersQueries.all() });
      router.push('/orders');
    },
  });

  const errorMessage =
    mutation.error instanceof ApiError ? mutation.error.message : null;

  return {
    items,
    submit: () => mutation.mutate(),
    isPending: mutation.isPending,
    errorMessage,
  };
}
