import { useMutation } from "@tanstack/react-query";

import type { Order, OrderItem } from "@/features/orders/model/types";
import { fetchJson } from "@/shared/api/fetcher";

type CreateOrderInput = { items: OrderItem[] };
type CreateOrderResult = { order: Order };

// 주문 생성도 보호 자원이다(meta.auth). 성공 뒤 처리(내역 무효화·이동)는 호출 컴포넌트가 맡는다.
export function useCreateOrder() {
  return useMutation({
    mutationFn: (input: CreateOrderInput) =>
      fetchJson<CreateOrderResult>("/api/orders", { method: "POST", body: input }),
    meta: { auth: true },
  });
}
