"use client";

import { useCartCount, useClearCart } from "@/entities/cart";

type ClearCartButtonProps = {
  className?: string;
};

// 장바구니 전체 비우기. cart entity의 공개 API(useClearCart·useCartCount)만 쓰고 wishlist는 알지 않는다.
// 빈 장바구니에선 누를 게 없어 비활성화한다. 스타일은 두는 곳이 정하도록 className을 받는다.
export function ClearCartButton({ className }: ClearCartButtonProps) {
  const clearCart = useClearCart();
  const count = useCartCount();

  return (
    <button type="button" className={className} onClick={() => clearCart()} disabled={count === 0}>
      장바구니 비우기
    </button>
  );
}
