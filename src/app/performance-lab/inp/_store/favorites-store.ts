import { createStore, type StoreApi } from "zustand/vanilla";

export const ADVANCED_A_INITIAL_FAVORITE_IDS = [
  "week07-product-03",
  "week07-product-11",
  "week07-product-19",
] as const;

export type AdvancedAFavoritesState = {
  favoriteIds: string[];
  toggleFavorite: (productId: string) => void;
};

export type AdvancedAFavoritesStore = StoreApi<AdvancedAFavoritesState>;

export function createAdvancedAFavoritesStore(): AdvancedAFavoritesStore {
  return createStore<AdvancedAFavoritesState>()((set) => ({
    favoriteIds: [...ADVANCED_A_INITIAL_FAVORITE_IDS],
    toggleFavorite: (productId) => {
      set((state) => ({
        favoriteIds: state.favoriteIds.includes(productId)
          ? state.favoriteIds.filter((favoriteId) => favoriteId !== productId)
          : [...state.favoriteIds, productId],
      }));
    },
  }));
}

export const advancedAFavoritesStore = createAdvancedAFavoritesStore();
