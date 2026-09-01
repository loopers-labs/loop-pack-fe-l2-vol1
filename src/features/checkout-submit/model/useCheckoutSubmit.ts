'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { createOrder } from '@/entities/order/api/orders';
import { ordersQueries } from '@/entities/order/api/ordersQueries';
import { useCartStore } from '@/entities/cart/model/cartStore';
import { ApiError } from '@/shared/api';

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
