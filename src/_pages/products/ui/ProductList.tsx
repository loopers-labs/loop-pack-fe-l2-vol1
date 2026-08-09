"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient, hashKey } from "@tanstack/react-query";
import type { QueryKey } from "@tanstack/react-query";
import { productQueries } from "@/entities/product";
import type { ProductListResponse } from "@/entities/product";
import { ProductListSkeleton } from "./ProductListSkeleton";
import { useProductListSearchParams } from "../model/useProductListSearchParams";
import { buildProductListTitle } from "../model/productListMetadata";
import { useDebouncedValue } from "@/shared/lib";
import { SITE_NAME } from "@/shared/config";
import { isServerError } from "@/shared/api";
import { ProductListResult } from "./ProductListResult";
import { SEARCH_DEBOUNCE_MS } from "@/features/search";
import layout from "@/shared/ui/layout.module.css";
import styles from "./ProductList.module.css";

const PRODUCT_LIST_LOAD_ERROR = "상품 목록을 불러오지 못했습니다.";
const PRODUCT_LIST_UPDATE_ERROR = "목록을 갱신하지 못했습니다.";

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

  // 에러 처리를 컴포넌트가 직접 한다: 갱신 실패는 직전 목록을 유지해야 하는데, 전역 throwOnError 는
  // 새 key 의 data(=undefined)만 보고 목록이 있어도 경계로 올려버린다 → 이 쿼리만 자동 throw 를 끈다.
  const {
    data,
    isPending,
    isPlaceholderData,
    isError,
    isSuccess,
    error,
    refetch,
  } = useQuery({ ...productQueries.list(activeQuery), throwOnError: false });

  // generateMetadata 는 서버에서 URL 당 1회만 실행된다. nuqs 는 검색/필터를 shallow로
  // 바꿔 서버를 안 거치므로, 그 경우 문서 title 이 갱신되지 않는다 → 표시 중인 조건에 맞춰 탭 title 을
  // 클라이언트에서 동기화한다(서버 template "%s | Commerce" 와 같은 형태).
  //
  // title 만 동기화하는 이유: title 은 사용자가 탭에서 본다. description·og 는 크롤러만 읽고,
  // 크롤러는 URL 을 서버에서 새로 받아 정확한 값을 얻으므로 클라이언트 동기화가 불필요하다.
  // isPlaceholderData(전환 중 이전 결과 표시) 땐 자기 결과가 아니므로 0개 판정에서 제외한다.
  const hasEmptyResult = !isPlaceholderData && data?.totalCount === 0;

  useEffect(() => {
    document.title = `${buildProductListTitle(activeQuery, hasEmptyResult)} | ${SITE_NAME}`;
  }, [activeQuery, hasEmptyResult]);

  const currentListKey = productQueries.list(activeQuery).queryKey;

  // "직전에 실제로 보던" active 쿼리 key 를 기억한다. 갱신 실패 시 이 key 로 Query Cache(단일 출처)에서
  // 목록을 읽어 화면을 그대로 유지한다. 캐시 전체의 "가장 최근 성공"을 쓰면 다음페이지 prefetch 가
  // 더 최근이라 보던 페이지가 아닌 prefetch 된 페이지로 바뀐다 — active 쿼리(=관측 대상)만 기억하면
  // prefetch 는 잡히지 않아 정확히 보던 페이지가 유지된다.
  //
  // 저장은 값(hashKey)으로 비교한다 — 검색 타이핑처럼 activeQuery 참조만 바뀌고 정규화 key 는 같은
  // 리렌더에선 저장하지 않는다. 참조로 비교하면 매 렌더 setState 가 반복돼 nuqs 의 URL 갱신과 경합한다.
  // isPlaceholderData(전환 중 이전 데이터 표시)일 땐 자기 데이터가 아니므로 제외한다.
  const [lastLoadedKey, setLastLoadedKey] = useState<QueryKey | null>(null);

  if (
    isSuccess &&
    !isPlaceholderData &&
    (lastLoadedKey === null ||
      hashKey(lastLoadedKey) !== hashKey(currentListKey))
  ) {
    setLastLoadedKey(currentListKey);
  }

  const previousList =
    isError && lastLoadedKey
      ? queryClient.getQueryData<ProductListResponse>(lastLoadedKey)
      : undefined;

  const listToShow = data ?? previousList;

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

  // 최초 실패(보여줄 직전 목록이 없음)에서 예상 못한 서버·네트워크 오류(5xx·network)만 경계로 → error.tsx.
  // 4xx(잘못된 조회 조건)는 재시도가 무의미하므로 아래에서 인라인 안내로 남긴다.
  if (isError && !listToShow && isServerError(error)) {
    throw error;
  }

  return (
    <>
      {/* keepPreviousData 라 페이지 전환 중엔 isPending 이 false 다 → 첫 로드에만 스켈레톤을 띄운다.
          isOverRange 면 곧 교정되니 빈 화면 대신 스켈레톤을 유지한다. */}
      {(isPending || isOverRange) && <ProductListSkeleton />}
      {/* 직전 목록이 있는데 갱신만 실패: 목록은 유지하고 위에 인라인으로 알리고 재시도를 준다(경계로 안 보냄). */}
      {isError && previousList && (
        <div className={styles.updateError}>
          <span>{PRODUCT_LIST_UPDATE_ERROR}</span>
          <button type="button" onClick={() => refetch()}>
            다시 시도
          </button>
        </div>
      )}
      {listToShow && !isOverRange && (
        // 전환 중(isPlaceholderData)엔 이전 목록을 흐리게 유지해 "갱신 중"을 표시(언마운트 금지)
        <div className={isPlaceholderData ? styles.updating : undefined}>
          <ProductListResult result={listToShow} onPageChange={setPage} />
        </div>
      )}
      {/* 최초 실패의 4xx: 보여줄 목록이 없고 재시도가 무의미한 경우의 상황 안내(5xx 는 위에서 경계로 throw). */}
      {isError && !listToShow && (
        <p className={layout.status}>{PRODUCT_LIST_LOAD_ERROR}</p>
      )}
    </>
  );
}
