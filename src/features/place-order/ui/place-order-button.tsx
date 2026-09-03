"use client";

import { useRouter } from "next/navigation";
import { CommerceApiError } from "@/shared/api/commerce-client";
import type { OrderItem } from "@/types/auth";
import { usePlaceOrder } from "../model/use-place-order";

type PlaceOrderButtonProps = {
  items: OrderItem[];
};

export function PlaceOrderButton({ items }: PlaceOrderButtonProps) {
  const router = useRouter();
  const { mutate, isPending, error } = usePlaceOrder({
    onPlaced: () => router.push("/orders"),
  });

  const errorMessage =
    error === null
      ? null
      : error instanceof CommerceApiError
        ? error.message
        : "잠시 후 다시 시도해 주세요.";

  return (
    <>
      {errorMessage === null ? null : <p role="alert">{errorMessage}</p>}
      <button
        type="button"
        disabled={isPending || items.length === 0}
        onClick={() => mutate({ items })}
      >
        {isPending ? "주문 중…" : "주문하기"}
      </button>
    </>
  );
}
