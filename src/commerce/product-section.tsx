"use client";

import type { Product } from "./api/types";
import { ProductCard } from "./product-card";
import styles from "./commerce.module.css";

export interface ProductSectionProps {
  title: string;
  products: Product[];
}

export function ProductSection({ title, products }: ProductSectionProps) {
  return (
    <section className={styles.section}>
      <h2>{title}</h2>
      {products.length === 0 ? (
        <p className={styles.message}>표시할 상품이 없습니다</p>
      ) : (
        <div className={styles.grid}>
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </section>
  );
}
