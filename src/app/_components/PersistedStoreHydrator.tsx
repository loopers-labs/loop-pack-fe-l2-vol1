'use client';

import { useEffect } from 'react';
import { useWishlistStore } from '@/entities/wishlist/model/wishlistStore';

export function PersistedStoreHydrator() {
  useEffect(() => {
    let isActive = true;

    const hydrate = async () => {
      await Promise.resolve(useWishlistStore.persist.rehydrate());

      if (!isActive) return;
      useWishlistStore.getState().setHydrated();
    };

    void hydrate();

    return () => {
      isActive = false;
    };
  }, []);

  return null;
}
