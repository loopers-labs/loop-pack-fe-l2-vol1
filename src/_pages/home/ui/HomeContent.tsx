"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
// ProductGrid 는 목록 페이지 slice 에 있으나 홈도 재사용한다 — 페이지 간 임시 import(3단계에서 해소).
import { ProductGrid } from "@/_pages/products/ui/ProductGrid";
import { PrefetchCategoryLink } from "@/components/commerce/PrefetchCategoryLink";
import { homeQueries } from "@/queries/home";
import type { Product } from "@/types/commerce";
import styles from "@/components/commerce/commerce.module.css";

function ProductSection({
  title,
  products,
}: {
  title: string;
  products: Product[];
}) {
  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>{title}</h2>
      {products.length === 0 ? (
        <p className={styles.status}>표시할 상품이 없습니다.</p>
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

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>카테고리</h2>
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
