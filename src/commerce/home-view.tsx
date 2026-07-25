"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { homeQueryOptions } from "./queries";
import { ProductSection } from "./product-section";
import styles from "./commerce.module.css";

const SKELETON_CARD_COUNT = 10;

export function HomeView() {
  const query = useQuery(homeQueryOptions());

  let body: ReactNode;

  if (query.isPending) {
    body = (
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
  } else if (query.isError) {
    // 내부 에러 메시지(query.error.message)를 노출하지 않고 화면이 고정 문구를 소유한다 — 재시도 버튼으로 같은 쿼리를 다시 fetch.
    body = (
      <p className={styles.message}>
        홈 데이터를 불러오지 못했습니다.
        <button type="button" onClick={() => query.refetch()}>
          재시도
        </button>
      </p>
    );
  } else {
    const { data } = query;
    body = (
      <>
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
      </>
    );
  }

  return <div className={styles.page}>{body}</div>;
}
