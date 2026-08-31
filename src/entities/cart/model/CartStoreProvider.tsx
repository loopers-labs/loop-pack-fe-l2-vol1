'use client';

import { useEffect, useMemo } from 'react';
import { cartPersistence } from './cartPersistence';
import { createCartStore } from './cartStore';
import { CartStoreContext } from './cartStoreContext';
import type { ReactNode } from 'react';
import type { CartOwnerKey } from './cartOwner';

interface CartStoreProviderProps {
  ownerKey: CartOwnerKey;
  children: ReactNode;
}

export function CartStoreProvider({
  ownerKey,
  children,
}: CartStoreProviderProps) {
  const store = useMemo(() => createCartStore(ownerKey), [ownerKey]);

  useEffect(() => {
    let isActive = true;

    const hydrate = async () => {
      cartPersistence.migrateLegacyGuestCart(ownerKey);

      try {
        await Promise.resolve(store.persist.rehydrate());
      } finally {
        if (isActive) {
          store.getState().setHydrated();
        }
      }
    };

    void hydrate();

    return () => {
      isActive = false;
    };
  }, [ownerKey, store]);

  return (
    <CartStoreContext.Provider value={store}>
      {children}
    </CartStoreContext.Provider>
  );
}
