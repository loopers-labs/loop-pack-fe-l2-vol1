"use client";

import { useStore } from "zustand";
import type { AdvancedAProduct } from "../_data/advanced-a-products";
import {
  advancedAFavoritesStore,
  type AdvancedAFavoritesStore,
} from "../_store/favorites-store";
import styles from "../performance-lab.module.css";
import { AdvancedAProductCard } from "./advanced-a-product-card";

type AdvancedAProductListProps = {
  products: AdvancedAProduct[];
  store?: AdvancedAFavoritesStore;
};

export function AdvancedAProductList({
  products,
  store = advancedAFavoritesStore,
}: AdvancedAProductListProps) {
  const { favoriteIds, toggleFavorite } = useStore(store);

  return (
    <section aria-labelledby="advanced-a-list-title">
      <div className={styles.listHeading}>
        <div>
          <p className={styles.eyebrow}>Interaction target</p>
          <h2 id="advanced-a-list-title">24-card render surface</h2>
        </div>
        <p className={styles.favoriteCount} aria-live="polite">
          찜 {favoriteIds.length}개
        </p>
      </div>

      <div className={styles.productGrid}>
        {products.map((product) => (
          <AdvancedAProductCard
            isFavorite={favoriteIds.includes(product.id)}
            key={product.id}
            onToggleFavorite={toggleFavorite}
            product={product}
          />
        ))}
      </div>
    </section>
  );
}
