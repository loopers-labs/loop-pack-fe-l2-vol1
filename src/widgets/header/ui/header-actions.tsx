"use client";

import { useCartStore } from "@/entities/cart";
import { useWishlistStore } from "@/entities/wishlist";

export function HeaderActions(): React.JSX.Element {
  const wishlistCount = useWishlistStore((state) => state.ids.size);
  const cartCount = useCartStore((state) => state.ids.size);

  return (
    <>
      <span>위시리스트 {wishlistCount}</span>
      <span>장바구니 {cartCount}</span>
    </>
  );
}
