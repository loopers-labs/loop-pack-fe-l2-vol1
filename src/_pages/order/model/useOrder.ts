'use client';

import { useEffect, useRef } from 'react';

import { useCartStore } from '@/entities/cart';
import { trackOrderComplete, trackOrderStart } from '@/shared/lib/analytics/events';
import { useMutation } from '@tanstack/react-query';

import { createOrder } from '../api/orderRequest';

/**
 * 주문 제출과 그 계측.
 *
 * order_start 는 담아둔 것이 있을 때만 알린다. 빈 주문서는 주문을 시작한 것이 아니라
 * 잘못 들어온 것이고, 그것까지 세면 3단계 퍼널에서 order_start 가 부풀어 전환율이 낮게 보인다.
 *
 * 진입 시점의 장바구니를 ref 에 담는다. 주문이 성공하면 장바구니를 비우므로, 완료 이벤트가
 * 참조할 때는 이미 비어 있다.
 */
export function useOrder() {
  const cart = useCartStore((state) => state.cart);
  const clearCart = useCartStore((state) => state.clearCart);
  const orderedProductIds = useRef(cart);

  useEffect(() => {
    if (orderedProductIds.current.length === 0) {
      return;
    }

    trackOrderStart(orderedProductIds.current);
  }, []);

  return useMutation({
    mutationFn: () => createOrder(cart.map((productId) => ({ productId, quantity: 1 }))),
    onSuccess: ({ order }) => {
      trackOrderComplete({ orderId: order.id, productIds: orderedProductIds.current });
      clearCart();
    },
  });
}
