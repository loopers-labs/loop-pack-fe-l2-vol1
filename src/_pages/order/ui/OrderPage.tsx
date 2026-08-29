"use client";

import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  selectCartProductQuantityMap,
  selectRemoveSelectedCartItems,
  selectSelectedCartCount,
  selectSelectedCartProductIdMap,
  useCartStore,
} from "@/entities/cart";
import { createOrder } from "@/entities/order";

export function OrderPage() {
  const router = useRouter();
  const cartProductQuantityMap = useCartStore(selectCartProductQuantityMap);
  const selectedCartProductIdMap = useCartStore(selectSelectedCartProductIdMap);
  const selectedCartCount = useCartStore(selectSelectedCartCount);
  const removeSelectedCartItems = useCartStore(selectRemoveSelectedCartItems);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const cartItems = Object.entries(cartProductQuantityMap).filter(
    ([productId]) => selectedCartProductIdMap[productId] === true,
  );
  const orderMutation = useMutation({
    mutationFn: createOrder,
    onMutate: () => {
      setErrorMessage(null);
    },
    onSuccess: () => {
      removeSelectedCartItems();
      router.push("/orders");
    },
    onError: (error) => {
      setErrorMessage(error.message);
    },
  });
  const handleCreateOrder = () => {
    orderMutation.mutate({
      items: cartItems.map(([productId, quantity]) => ({ productId, quantity })),
    });
  };

  return (
    <section className="mt-10 grid gap-4">
      <div className="grid gap-2">
        <p className="text-sm font-semibold text-gds-green-700">Order</p>
        <h1 className="text-3xl font-bold tracking-tight text-gds-gray-900">주문서</h1>
        <p className="text-sm leading-6 text-gds-gray-700">
          장바구니 상품을 주문하기 전에 배송지와 결제 정보를 확인합니다.
        </p>
      </div>

      <div className="rounded-gds-lg bg-white p-5 shadow-[inset_0_0_0_1px_var(--color-gds-gray-200)]">
        {cartItems.length === 0 ? (
          <div className="grid gap-4">
            <p className="text-sm text-gds-gray-700">주문할 상품이 없습니다.</p>
            <Link
              className="w-fit rounded-gds-sm border border-gds-green-500 bg-gds-green-500 px-4 py-2 text-sm font-semibold text-white hover:bg-gds-green-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gds-green-500"
              href="/cart"
            >
              장바구니로 돌아가기
            </Link>
          </div>
        ) : (
          <div className="grid gap-5">
            <p className="text-sm font-semibold text-gds-gray-900">총 {selectedCartCount}개</p>
            <ul className="grid gap-3 border-t border-gds-gray-200 pt-5">
              {cartItems.map(([productId, quantity]) => (
                <li
                  key={productId}
                  className="rounded-gds-sm bg-gds-gray-50 px-4 py-3"
                  aria-label={`${productId} 수량 ${quantity}`}
                >
                  <p className="text-sm font-semibold text-gds-gray-900">{productId}</p>
                  <p className="text-xs text-gds-gray-600">수량 {quantity}</p>
                </li>
              ))}
            </ul>

            {errorMessage !== null ? (
              <p className="rounded-gds-sm bg-gds-gray-50 px-3 py-2 text-sm font-semibold text-gds-red-500 shadow-[inset_0_0_0_1px_var(--color-gds-red-500)]">
                {errorMessage}
              </p>
            ) : null}

            <button
              className="w-fit justify-self-end rounded-gds-sm border border-gds-green-500 bg-gds-green-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-gds-green-700 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gds-green-500"
              type="button"
              disabled={orderMutation.isPending}
              onClick={handleCreateOrder}
            >
              {orderMutation.isPending ? "주문 중입니다." : "주문 완료"}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
