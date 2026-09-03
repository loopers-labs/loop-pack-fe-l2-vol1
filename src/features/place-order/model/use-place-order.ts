"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCartStore } from "@/entities/cart";
import { createOrder, ORDERS_QUERY_KEY } from "@/entities/order";
import { trackEvent } from "@/shared/analytics";
import type { Order } from "@/types/auth";

type PlaceOrderOptions = {
  totalPrice: number;
  onPlaced: (order: Order) => void;
};

// 주문이 서버에 만들어진 뒤에만 장바구니를 비운다. 실패하면 담은 것이 그대로 남아 다시 시도할 수 있다.
// onPlaced(이동)를 비우기보다 먼저 부른다 — 장바구니가 비면 주문서가 빈 화면으로 바뀌며 버튼이 언마운트되고,
// 그 뒤에 예약된 호출 단위 콜백은 버려지기 때문이다
export function usePlaceOrder({ totalPrice, onPlaced }: PlaceOrderOptions) {
  const queryClient = useQueryClient();
  const clearCart = useCartStore((state) => state.clear);

  return useMutation({
    mutationFn: createOrder,
    onSuccess: (order) => {
      trackEvent("order_complete", {
        orderId: order.id,
        productIds: order.items.map((item) => item.productId),
        itemCount: order.items.length,
        totalPrice,
      });
      onPlaced(order);
      clearCart();
      void queryClient.invalidateQueries({ queryKey: ORDERS_QUERY_KEY });
    },
  });
}
