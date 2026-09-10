"use client";

import Link from "next/link";
import { useCartStore } from "@/entities/cart";
import { useWishlistStore } from "@/entities/wishlist";

export function HeaderActions(): React.JSX.Element {
  const wishlistCount = useWishlistStore((state) => state.ids.size);
  const cartCount = useCartStore((state) => state.ids.size);

  return (
    <>
      <span>위시리스트 {wishlistCount}</span>
      {/* 보호 경로는 미리 가져오지 않는다 — 미로그인 상태에서 prefetch 하면 proxy 의 로그인 리다이렉트가
          라우터 캐시에 남아 로그인 뒤 복원 이동이 그 캐시를 재생한다 */}
      <Link href="/checkout" prefetch={false}>
        장바구니 {cartCount}
      </Link>
    </>
  );
}
