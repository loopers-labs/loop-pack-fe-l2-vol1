import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface WishlistState {
  ids: Set<string>;
  isHydrated: boolean;
  toggle: (id: string) => void;
  has: (id: string) => boolean;
  setHydrated: () => void;
}

interface WishlistPersistedState {
  ids: string[];
}

export const WISHLIST_STORAGE_KEY = 'aesthetic-wishlist';

function parsePersistedIds(value: unknown): Set<string> {
  if (!value || typeof value !== 'object' || !('ids' in value)) {
    return new Set();
  }

  const ids = value.ids;
  if (!Array.isArray(ids)) return new Set();

  return new Set(ids.filter((id): id is string => typeof id === 'string'));
}

export const useWishlistStore = create<WishlistState>()(
  persist<WishlistState, [], [], WishlistPersistedState>((set, get) => ({
  ids: new Set(),
  isHydrated: false,

  toggle: (id) =>
    set((state) => {
      const next = new Set(state.ids);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return { ids: next };
    }),

  has: (id) => get().ids.has(id),
  setHydrated: () => set({ isHydrated: true }),
}), {
  name: WISHLIST_STORAGE_KEY,
  version: 1,
  storage: createJSONStorage(() => localStorage),
  skipHydration: true,
  partialize: (state) => ({ ids: Array.from(state.ids) }),
  merge: (persistedState, currentState) => ({
    ...currentState,
    ids: parsePersistedIds(persistedState),
  }),
  migrate: () => ({ ids: [] }),
}),
);
