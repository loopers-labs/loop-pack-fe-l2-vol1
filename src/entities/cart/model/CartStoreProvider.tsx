'use client';

import { useEffect, useMemo } from 'react';
import { cartPersistence } from './cartPersistence';
import { createCartStore } from './cartStore';
import { CartStoreContext } from './cartStoreContext';
import type { ReactNode } from 'react';
import {
  CART_ACTIVE_OWNER_STORAGE_KEY,
  GUEST_CART_OWNER,
  getCartStorageKey,
} from './cartOwner';
import {
  reloadCurrentPage,
  shouldReloadForCartOwnerChange,
} from './cartOwnerSync';
import type { CartOwnerKey } from './cartOwner';
import type { CartStore } from './cartStore';

interface CartStoreProviderProps {
  ownerKey: CartOwnerKey;
  children: ReactNode;
}

async function mergeGuestCartIntoMember(
  store: CartStore,
  isActive: () => boolean,
): Promise<void> {
  const guestStore = createCartStore(GUEST_CART_OWNER);
  await Promise.resolve(guestStore.persist.rehydrate());

  if (!isActive()) return;

  const guestItems = guestStore.getState().items;
  if (guestItems.size === 0) return;

  store.getState().mergeItems(guestItems.values());
  guestStore.getState().clearItems();
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
        if (!isActive) return;

        if (ownerKey !== GUEST_CART_OWNER) {
          await mergeGuestCartIntoMember(store, () => isActive);
        }
      } finally {
        if (isActive) {
          store.getState().setHydrated();
          localStorage.setItem(CART_ACTIVE_OWNER_STORAGE_KEY, ownerKey);
        }
      }
    };

    void hydrate();

    return () => {
      isActive = false;
    };
  }, [ownerKey, store]);

  useEffect(() => {
    const storageKey = getCartStorageKey(ownerKey);
    const handleStorage = (event: StorageEvent) => {
      const isLocalStorage = event.storageArea === localStorage;
      if (!isLocalStorage) return;

      if (event.key === CART_ACTIVE_OWNER_STORAGE_KEY) {
        if (shouldReloadForCartOwnerChange(ownerKey, event.newValue)) {
          reloadCurrentPage();
        }
        return;
      }

      const isActiveOwner = event.key === storageKey || event.key === null;
      if (!isActiveOwner) return;
      void Promise.resolve(store.persist.rehydrate());
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [ownerKey, store]);

  return (
    <CartStoreContext.Provider value={store}>
      {children}
    </CartStoreContext.Provider>
  );
}
