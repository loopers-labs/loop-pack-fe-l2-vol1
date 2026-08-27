"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  useCartCount,
  useCartHasHydrated,
  useCartIds,
  useClearCart,
} from "@/entities/cart";
import { CartLineList } from "@/widgets/cart";
import { createOrder, orderQueries } from "../api/orderQueries";
import styles from "./NewOrderSection.module.css";

const ORDER_ERROR = "주문에 실패했습니다. 잠시 후 다시 시도해주세요.";
// 카트는 수량 개념이 없어 담긴 상품마다 1개로 주문한다.
const ORDER_QUANTITY = 1;

export function NewOrderSection() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const ids = useCartIds();
  const count = useCartCount();
  const hasHydrated = useCartHasHydrated();
  const clearCart = useClearCart();

  const mutation = useMutation({
    mutationFn: createOrder,
    onSuccess: () => {
      // 주문된 상품은 카트에서 비운다(카트가 곧 주문). 목록은 이 생성으로만 바뀌므로 무효화 후 이동.
      clearCart();
      queryClient.invalidateQueries({ queryKey: orderQueries.all() });
      router.push("/orders");
    },
  });

  const canOrder = hasHydrated && count > 0;

  const handleOrder = () => {
    mutation.mutate(
      [...ids].map((productId) => ({ productId, quantity: ORDER_QUANTITY })),
    );
  };

  return (
    <div className={styles.sheet}>
      <CartLineList />

      {mutation.isError && (
        <p role="alert" className={styles.error}>
          {ORDER_ERROR}
        </p>
      )}

      <button
        type="button"
        className={styles.submit}
        onClick={handleOrder}
        disabled={!canOrder || mutation.isPending}
      >
        주문하기
      </button>
    </div>
  );
}
