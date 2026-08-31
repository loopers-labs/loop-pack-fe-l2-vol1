'use client';

import { useContext } from 'react';
import { useStore } from 'zustand';
import { CartStoreContext } from './cartStoreContext';
import type { CartState } from './cartTypes';

function useCartStoreApi() {
  const store = useContext(CartStoreContext);

  if (!store) {
    throw new Error('useCartStore must be used within CartStoreProvider.');
  }

  return store;
}

export function useCartStore<T>(selector: (state: CartState) => T): T {
  const store = useCartStoreApi();
  return useStore(store, selector);
}
