"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { homeQueryOptions } from "./queries";
import { ProductSection } from "./product-section";
import styles from "./commerce.module.css";

const SKELETON_CARD_COUNT = 10;

export function HomeView() {
  const query = useQuery(homeQueryOptions());

  if (query.isPending) {
    return (
      <div
        className={styles.skeleton}
        role="status"
        aria-busy="true"
        aria-label="상품을 불러오는 중"
      >
        {Array.from({ length: SKELETON_CARD_COUNT }, (_, index) => (
          <div key={index} className={styles.skeletonCard} />
        ))}
      </div>
    );
  }

  if (query.isError) {
    return <p className={styles.message}>{query.error.message}</p>;
  }

  const { data } = query;

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <p>{data.banner.description}</p>
        <h1>{data.banner.title}</h1>
      </section>
      <section className={styles.section}>
        <h2>카테고리</h2>
        <div className={styles.categories}>
          {data.categories.map((category) => (
            <Link key={category.id} href={`/products?category=${category.id}`}>
              {category.name}
            </Link>
          ))}
        </div>
      </section>
      <ProductSection title="인기 상품" products={data.popularProducts} />
      <ProductSection title="신상품" products={data.newProducts} />
    </div>
  );
}
