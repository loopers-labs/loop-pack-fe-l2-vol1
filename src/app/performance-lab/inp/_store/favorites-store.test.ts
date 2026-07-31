import { describe, expect, it } from "vitest";
import {
  ADVANCED_A_INITIAL_FAVORITE_IDS,
  createAdvancedAFavoritesStore,
} from "./favorites-store";

describe("Advanced A favorites store", () => {
  it("starts every profiling run from the fixed favorite state", () => {
    const store = createAdvancedAFavoritesStore();

    expect(ADVANCED_A_INITIAL_FAVORITE_IDS).toEqual([
      "week07-product-03",
      "week07-product-11",
      "week07-product-19",
    ]);
    expect(store.getState().favoriteIds).toEqual(
      ADVANCED_A_INITIAL_FAVORITE_IDS,
    );
  });

  it("updates favorite feedback synchronously on each click", () => {
    const store = createAdvancedAFavoritesStore();
    const productId = "week07-product-08";

    store.getState().toggleFavorite(productId);
    expect(store.getState().favoriteIds).toContain(productId);

    store.getState().toggleFavorite(productId);
    expect(store.getState().favoriteIds).not.toContain(productId);
  });
});
