'use client';

import { useEffect } from 'react';
import { useCartStore } from '@/entities/cart/model/cartStore';
import { useWishlistStore } from '@/entities/wishlist/model/wishlistStore';

export function PersistedStoreHydrator() {
  useEffect(() => {
    let isActive = true;

    const hydrate = async () => {
      await Promise.all([
        Promise.resolve(useCartStore.persist.rehydrate()),
        Promise.resolve(useWishlistStore.persist.rehydrate()),
      ]);

      if (!isActive) return;
      useCartStore.getState().setHydrated();
      useWishlistStore.getState().setHydrated();
    };

    void hydrate();

    return () => {
      isActive = false;
    };
  }, []);

  return null;
}
