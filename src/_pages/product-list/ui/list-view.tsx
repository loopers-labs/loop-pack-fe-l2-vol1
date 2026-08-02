"use client";

import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { ProductCard } from "@/entities/product";
import { AddToCartButton } from "@/features/add-to-cart";
import { WishlistToggleButton } from "@/features/toggle-wishlist";
import { productListQueryOptions } from "../api/queries";
import { PAGE_SIZE, useListQuery } from "../model/use-list-query";
import { ListFilterBar } from "./list-filter-bar";
import { ListPagination } from "./list-pagination";
import styles from "./product-list.module.css";

const SKELETON_CARD_COUNT = 12;

export function ListView() {
  const [query, setQuery, resetQuery] = useListQuery();
  const listQuery = { ...query, pageSize: PAGE_SIZE };
  const result = useQuery(productListQueryOptions(listQuery));

  let body: ReactNode;

  if (result.isPending) {
    // F1: 로딩 — 12개 스켈레톤.
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
  } else if (result.isError) {
    // F2: 에러 — 재시도 버튼으로 같은 쿼리를 다시 fetch.
    body = (
      <p className={styles.message}>
        상품 목록을 불러오지 못했습니다
        <button type="button" onClick={() => result.refetch()}>
          재시도
        </button>
      </p>
    );
  } else {
    const { data } = result;
    // F3(검색 조건 문제)과 F4(페이지 위치 문제)는 서로 배타적이라
    // isOutOfRange가 !isEmpty를 전제해 두 문구가 동시에 뜨지 않는다.
    const isEmpty = data.totalCount === 0;
    const isOutOfRange = !isEmpty && data.products.length === 0;

    body = (
      <>
        {/* F5: pending·error를 뺀 나머지 세 분기 전부에서 총 개수를 표시. */}
        <p className={styles.total}>총 {data.totalCount}개</p>
        {isEmpty && <p className={styles.message}>검색 결과가 없습니다</p>}
        {isOutOfRange && (
          <p className={styles.message}>
            이 페이지에는 상품이 없습니다
            <button type="button" onClick={() => setQuery({ page: 1 })}>
              1페이지로 이동
            </button>
          </p>
        )}
        {!isEmpty && !isOutOfRange && (
          <>
            <div className={styles.grid}>
              {data.products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  actions={
                    <div className={styles.actions}>
                      <AddToCartButton productId={product.id} productName={product.name} />
                      <WishlistToggleButton productId={product.id} productName={product.name} />
                    </div>
                  }
                />
              ))}
            </div>
            <ListPagination
              page={data.page}
              totalCount={data.totalCount}
              pageSize={data.pageSize}
              onPageChange={(page) => setQuery({ page })}
            />
          </>
        )}
      </>
    );
  }

  return (
    <div className={styles.page}>
      <section className={styles.section}>
        {/* F5b: 다섯 분기 전부에서 필터바가 마운트된 채 enabled로 남는다 — 분기는 이 아래 body만 갈아낀다. */}
        <ListFilterBar query={query} setQuery={setQuery} onReset={resetQuery} />
        {body}
      </section>
    </div>
  );
}
