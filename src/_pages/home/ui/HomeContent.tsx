"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { ProductGrid } from "@/widgets/product-card";
import { PrefetchCategoryLink } from "@/features/category-select";
import { homeQueries } from "../api/home";
import type { Product } from "@/entities/product";
import layout from "@/shared/ui/layout.module.css";
import styles from "./HomeContent.module.css";

function ProductSection({
  title,
  products,
}: {
  title: string;
  products: Product[];
}) {
  return (
    <section className={layout.section}>
      <h2 className={layout.sectionTitle}>{title}</h2>
      {products.length === 0 ? (
        <p className={layout.status}>표시할 상품이 없습니다.</p>
      ) : (
        <ProductGrid products={products} />
      )}
    </section>
  );
}

export function HomeContent() {
  const { data: home } = useSuspenseQuery(homeQueries.detail());

  return (
    <>
      <section className={styles.hero}>
        <p>{home.banner.description}</p>
        <h1>{home.banner.title}</h1>
      </section>

      <section className={layout.section}>
        <h2 className={layout.sectionTitle}>카테고리</h2>
        <div className={styles.categories}>
          {home.categories.map((category) => (
            <PrefetchCategoryLink
              key={category.id}
              category={category.id}
              href={`/products?category=${category.id}`}
              className={styles.categoryChip}
            >
              {category.name}
            </PrefetchCategoryLink>
          ))}
        </div>
      </section>

      <ProductSection title="인기 상품" products={home.popularProducts} />
      <ProductSection title="신상품" products={home.newProducts} />
    </>
  );
}
