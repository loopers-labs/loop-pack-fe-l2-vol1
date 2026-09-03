"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCartStore } from "@/entities/cart";
import { createOrder, ORDERS_QUERY_KEY } from "@/entities/order";

// 주문이 서버에 만들어진 뒤에만 장바구니를 비운다. 실패하면 담은 것이 그대로 남아 다시 시도할 수 있다
export function usePlaceOrder() {
  const queryClient = useQueryClient();
  const clearCart = useCartStore((state) => state.clear);

  return useMutation({
    mutationFn: createOrder,
    onSuccess: () => {
      clearCart();
      void queryClient.invalidateQueries({ queryKey: ORDERS_QUERY_KEY });
    },
  });
}
