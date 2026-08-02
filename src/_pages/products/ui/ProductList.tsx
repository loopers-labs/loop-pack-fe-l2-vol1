"use client";

import { useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { productQueries } from "@/entities/product";
import { useProductListSearchParams } from "../model/useProductListSearchParams";
import { useDebouncedValue } from "@/shared/lib";
import { ProductListResult } from "./ProductListResult";
import { SEARCH_DEBOUNCE_MS } from "@/features/search";
import layout from "@/shared/ui/layout.module.css";
import styles from "./ProductList.module.css";

const PRODUCT_LIST_LOAD_ERROR = "상품 목록을 불러오지 못했습니다.";

export function ProductList() {
  const { query, setPage, clampPageToRange } = useProductListSearchParams();
  const queryClient = useQueryClient();

  // query.q 는 타이핑마다 실시간(replace)으로 바뀐다. 조회는 디바운스로 유지해야 하므로
  // q 만 디바운스한 조건으로 fetch 한다 — 타이핑 중엔 요청이 나가지 않고 멈춘 뒤에만 나간다.
  const debouncedSearch = useDebouncedValue(query.q, SEARCH_DEBOUNCE_MS);
  const activeQuery = useMemo(
    () => ({ ...query, q: debouncedSearch }),
    [query, debouncedSearch],
  );

  const { data, isPending, isPlaceholderData, isError } = useQuery(
    productQueries.list(activeQuery),
  );

  const totalPages = data ? Math.ceil(data.totalCount / data.pageSize) : 0;
  const isOverRange = totalPages >= 1 && query.page > totalPages;
  const hasNextPage = query.page < totalPages;

  useEffect(() => {
    clampPageToRange(totalPages);
  }, [totalPages, clampPageToRange]);

  // 다음 페이지 선제 prefetch — "다음" 클릭 시 캐시 hit 으로 즉시 표시(keepPreviousData 와 결합).
  // isPlaceholderData(이전 조건 데이터로 그리는 과도기) 중엔 하지 않는다: 이전 totalPages 기준으로
  // 엉뚱한 페이지를 미리 받는 것을 막는다.
  useEffect(() => {
    if (isPlaceholderData || !data || !hasNextPage) return;

    queryClient.prefetchQuery(
      productQueries.list({ ...activeQuery, page: activeQuery.page + 1 }),
    );
  }, [queryClient, activeQuery, data, hasNextPage, isPlaceholderData]);

  return (
    <>
      {/* keepPreviousData 라 페이지 전환 중엔 isPending 이 false 다 → 첫 로드에만 로딩을 띄운다.
          isOverRange 면 곧 교정되니 빈 화면 대신 로딩을 유지한다. */}
      {(isPending || isOverRange) && (
        <p className={layout.status}>상품 목록을 불러오는 중…</p>
      )}
      {data && !isOverRange && (
        // 전환 중(isPlaceholderData)엔 이전 목록을 흐리게 유지해 "갱신 중"을 표시(언마운트 금지)
        <div className={isPlaceholderData ? styles.updating : undefined}>
          <ProductListResult result={data} onPageChange={setPage} />
        </div>
      )}
      {/* 4xx(잘못된 조회 조건)는 throwOnError 가 경계로 안 올린다(앱↔서버 계약 불일치라 재시도가 무의미).
          보여줄 데이터가 없을 때만 목록 자리에 상황 안내를 띄운다 — background refetch 실패는 위 data 분기가 stale 로 유지한다. */}
      {isError && !data && (
        <p className={layout.status}>{PRODUCT_LIST_LOAD_ERROR}</p>
      )}
    </>
  );
}
