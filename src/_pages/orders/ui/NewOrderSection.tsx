"use client";

import { type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createOrder, orderQueries } from "../api/orderQueries";
import styles from "./NewOrderSection.module.css";

// API 는 상품 id 를 p1~p30 형식으로만 검증한다. 폼은 그 범위의 id 를 선택지로 제공한다.
const PRODUCT_ID_COUNT = 30;
const PRODUCT_IDS = Array.from(
  { length: PRODUCT_ID_COUNT },
  (_, index) => `p${index + 1}`,
);

const ORDER_ERROR = "주문에 실패했습니다. 잠시 후 다시 시도해주세요.";

export function NewOrderSection() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: createOrder,
    onSuccess: () => {
      // 목록의 유일한 변경 지점 — 새 주문이 목록에 즉시 반영되도록 무효화한 뒤 이동한다.
      queryClient.invalidateQueries({ queryKey: orderQueries.all() });
      router.push("/orders");
    },
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    mutation.mutate([
      {
        productId: String(formData.get("productId") ?? ""),
        quantity: Number(formData.get("quantity") ?? 1),
      },
    ]);
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <label className={styles.field}>
        <span>상품</span>
        <select name="productId" defaultValue={PRODUCT_IDS[0]}>
          {PRODUCT_IDS.map((productId) => (
            <option key={productId} value={productId}>
              {productId}
            </option>
          ))}
        </select>
      </label>
      <label className={styles.field}>
        <span>수량</span>
        <input
          name="quantity"
          type="number"
          min={1}
          defaultValue={1}
          required
        />
      </label>

      {mutation.isError && (
        <p role="alert" className={styles.error}>
          {ORDER_ERROR}
        </p>
      )}

      <button
        type="submit"
        className={styles.submit}
        disabled={mutation.isPending}
      >
        주문하기
      </button>
    </form>
  );
}
