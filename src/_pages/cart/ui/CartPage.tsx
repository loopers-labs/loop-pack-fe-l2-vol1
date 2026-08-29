"use client";

import Link from "next/link";
import {
  selectCartCount,
  selectCartProductQuantityMap,
  selectDecreaseCartQuantity,
  selectIncreaseCartQuantity,
  selectSelectedCartCount,
  selectSelectedCartProductIdMap,
  selectToggleCartItemSelection,
  useCartStore,
} from "@/entities/cart";

export function CartPage() {
  const cartProductQuantityMap = useCartStore(selectCartProductQuantityMap);
  const selectedCartProductIdMap = useCartStore(selectSelectedCartProductIdMap);
  const cartCount = useCartStore(selectCartCount);
  const selectedCartCount = useCartStore(selectSelectedCartCount);
  const increaseCartQuantity = useCartStore(selectIncreaseCartQuantity);
  const decreaseCartQuantity = useCartStore(selectDecreaseCartQuantity);
  const toggleCartItemSelection = useCartStore(selectToggleCartItemSelection);
  const cartItems = Object.entries(cartProductQuantityMap);

  return (
    <section className="mt-10 grid gap-6">
      <div className="grid gap-2">
        <p className="text-sm font-semibold text-gds-green-700">Cart</p>
        <h1 className="text-3xl font-bold tracking-tight text-gds-gray-900">장바구니</h1>
        <p className="text-sm leading-6 text-gds-gray-700">담아둔 상품 수량을 확인합니다.</p>
      </div>

      <div className="rounded-gds-lg bg-white p-5 shadow-[inset_0_0_0_1px_var(--color-gds-gray-200)]">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <p className="text-sm font-semibold text-gds-gray-900">총 {cartCount}개</p>
          <p className="text-sm font-semibold text-gds-gray-700">선택 {selectedCartCount}개</p>
        </div>

        {cartItems.length === 0 ? (
          <div className="mt-5 grid gap-4 border-t border-gds-gray-200 pt-5">
            <p className="text-sm text-gds-gray-700">장바구니가 비어 있습니다.</p>
            <Link
              className="w-fit rounded-gds-sm border border-gds-green-500 bg-gds-green-500 px-4 py-2 text-sm font-semibold text-white hover:bg-gds-green-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gds-green-500"
              href="/products"
            >
              상품 둘러보기
            </Link>
          </div>
        ) : (
          <div className="mt-5 grid gap-5 border-t border-gds-gray-200 pt-5">
            <ul className="grid gap-3">
              {cartItems.map(([productId, quantity]) => (
                <li
                  key={productId}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-gds-sm bg-gds-gray-50 px-4 py-3"
                  aria-label={`${productId} 수량 ${quantity}`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      className="size-4 accent-gds-green-500"
                      type="checkbox"
                      aria-label={`${productId} 주문 선택`}
                      checked={selectedCartProductIdMap[productId] === true}
                      onChange={() => toggleCartItemSelection(productId)}
                    />
                    <div className="grid gap-1">
                      <p className="text-sm font-semibold text-gds-gray-900">{productId}</p>
                      <p className="text-xs text-gds-gray-600">수량 {quantity}</p>
                    </div>
                  </div>
                  <div className="inline-flex items-center gap-2">
                    <button
                      className="inline-flex size-9 cursor-pointer items-center justify-center rounded-gds-sm border border-gds-gray-300 bg-white text-lg font-semibold text-gds-gray-900 hover:border-gds-green-500 hover:text-gds-green-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gds-green-500"
                      type="button"
                      aria-label={`${productId} 수량 감소`}
                      onClick={() => decreaseCartQuantity(productId)}
                    >
                      -
                    </button>
                    <span className="min-w-8 text-center text-sm font-semibold text-gds-gray-900">
                      {quantity}
                    </span>
                    <button
                      className="inline-flex size-9 cursor-pointer items-center justify-center rounded-gds-sm border border-gds-gray-300 bg-white text-lg font-semibold text-gds-gray-900 hover:border-gds-green-500 hover:text-gds-green-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gds-green-500"
                      type="button"
                      aria-label={`${productId} 수량 증가`}
                      onClick={() => increaseCartQuantity(productId)}
                    >
                      +
                    </button>
                  </div>
                </li>
              ))}
            </ul>
            {selectedCartCount > 0 ? (
              <Link
                className="w-fit justify-self-end rounded-gds-sm border border-gds-green-500 bg-gds-green-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-gds-green-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gds-green-500"
                href="/order"
              >
                주문하기
              </Link>
            ) : null}
          </div>
        )}
      </div>
    </section>
  );
}
