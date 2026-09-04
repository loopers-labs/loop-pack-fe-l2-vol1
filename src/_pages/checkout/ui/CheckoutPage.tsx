"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { ORDERS_QUERY_KEY, type OrderCreateResponse } from "@/entities/order";
import type { Product } from "@/entities/product";
import { HttpError, postJson } from "@/shared/api";

type CheckoutPageProps = {
  product: Product | null;
  quantity: number;
};

function describeFailure(error: unknown): string {
  if (error instanceof HttpError && error.status === 401) {
    return "세션이 만료되었습니다. 다시 로그인해 주세요.";
  }
  return "주문을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.";
}

export function CheckoutPage({ product, quantity }: CheckoutPageProps) {
  const queryClient = useQueryClient();
  const router = useRouter();

  const order = useMutation({
    mutationFn: (productId: string) =>
      postJson<OrderCreateResponse>("/api/orders", {
        items: [{ productId, quantity }],
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ORDERS_QUERY_KEY });
      router.push("/orders");
    },
  });

  // 없는 상품 id로 들어온 경우. 조건을 바꿔 빠져나갈 수 있으므로 화면 안에서 처리한다.
  if (product === null) {
    return (
      <main className="shop-page">
        <h1>주문서</h1>
        <p className="shop-state" role="alert">
          주문할 상품을 찾지 못했습니다. 상품 목록에서 다시 골라 주세요.
        </p>
      </main>
    );
  }

  const total = product.price * quantity;

  return (
    <main className="shop-page">
      <h1>주문서</h1>
      <section className="shop-section" aria-label="주문 상품">
        <h2>{product.name}</h2>
        <p>{product.brand}</p>
        <p>수량 {quantity}개</p>
        {/* 서버 주문 응답에는 금액이 없다. 표시용 합계는 상품 데이터로 계산한다. */}
        <p aria-label={`결제 예정 금액 ${total}원`}>{total.toLocaleString("ko-KR")}원</p>
      </section>

      {order.isError && (
        <p className="shop-state" role="alert">
          {describeFailure(order.error)}
        </p>
      )}

      <button type="button" disabled={order.isPending} onClick={() => order.mutate(product.id)}>
        {order.isPending ? "주문하는 중…" : "주문하기"}
      </button>
    </main>
  );
}
