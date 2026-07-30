"use client";

import { useEffect } from "react";
import { useCartStore } from "@/entities/cart";
import { useWishlistStore } from "@/entities/wishlist";

export function CommerceStoreHydrator() {
  useEffect(() => {
    void useCartStore.persist.rehydrate();
    void useWishlistStore.persist.rehydrate();
  }, []);

  return null;
}
