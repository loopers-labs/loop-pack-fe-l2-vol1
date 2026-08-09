"use client";

import { useCallback, useEffect, useMemo } from "react";
import { createLoader, useQueryStates } from "nuqs";
import { productListParsers } from "./productListParsers";
import {
  clampPageToLowerBound,
  FIRST_PAGE,
  resolveProductListQuery,
} from "@/entities/product";
import type { CategoryId, ProductSort } from "@/entities/product";

const PUSH_TO_HISTORY = { history: "push" } as const;
const REPLACE_HISTORY = { history: "replace" } as const;

const loadProductListParams = createLoader(productListParsers);

type ProductListFilter = {
  category?: CategoryId | "all";
  sort?: ProductSort;
};

/**
 * 목록 조건의 원본은 URL이다. 이 훅이 URL ↔ productList 조건 변환을 전담한다.
 */
export function useProductListSearchParams() {
  const [queryState, setQueryState] = useQueryStates(
    productListParsers,
    PUSH_TO_HISTORY,
  );

  // resolveProductListQuery 는 스프레드로 매 렌더 새 객체를 만든다 — query 를 그대로 넘기면 이를 deps 로
  // 쓰는 소비자(useQuery/useEffect)가 매 렌더 재실행된다. queryState 는 nuqs 가 참조를 안정적으로 유지하므로
  // 그것이 바뀔 때(실제 파싱값 변경)만 새 query 참조가 나오게 memo 한다.
  const query = useMemo(
    () => resolveProductListQuery(queryState),
    [queryState],
  );

  // 하드 리로드를 한 번 거친 뒤 뒤로/앞으로가기(popstate)로 돌아오면, Next 가 그 URL 변경을 nuqs 로
  // 전파하지 못해 조건(queryState)이 옛 값에 얼어붙는 경우가 있다 — 주소창·서버 HTML 은 새 URL 인데
  // 입력창·조회 조건만 옛 값으로 남는다(브라우저로 확인). window.location 은 항상 진실이므로, popstate 때
  // 그 값을 읽어 nuqs 상태를 URL 에 다시 맞춘다(새로고침 없이 클라에서 재동기화).
  useEffect(() => {
    const syncStateFromUrl = () =>
      setQueryState(loadProductListParams(window.location.search), {
        history: "replace",
      });

    window.addEventListener("popstate", syncStateFromUrl);

    return () => window.removeEventListener("popstate", syncStateFromUrl);
  }, [setQueryState]);

  // URL 의 page 를 유효 범위 [FIRST_PAGE, totalPages] 로 교정한다 — 상한(totalPages)는 사용하는 곳에서 넘긴다.
  // 사용자 네비가 아닌 교정이라 replace 로 덮어 뒤로가기가 무효 page 로 돌아가지 않게 한다.
  const clampPageToRange = useCallback(
    (totalPages: number) => {
      const lowerBounded = clampPageToLowerBound(queryState.page);
      const upperBounded = Math.min(lowerBounded, totalPages);
      const hasPages = totalPages >= FIRST_PAGE;
      const clamped = hasPages ? upperBounded : lowerBounded;

      if (clamped !== queryState.page) {
        setQueryState({ page: clamped }, REPLACE_HISTORY);
      }
    },
    [queryState.page, setQueryState],
  );

  // setQueryState 는 nuqs 가 안정적으로 유지하므로, hook을 사용하는 측에서(effect deps 등) 안심하고
  // 의존할 수 있도록 핸들러도 안정적인 참조로 노출한다.

  // 새 검색을 시작한다 — push 로 새 히스토리 엔트리를 연다. 뒤로가기로 이전 확정 검색어로 돌아갈 수 있게.
  const beginSearch = useCallback(
    (q: string) => setQueryState({ q, page: FIRST_PAGE }, PUSH_TO_HISTORY),
    [setQueryState],
  );
  // 진행 중인 검색어를 실시간 갱신한다 — replace 로 현재 엔트리만 덮어 히스토리를 늘리지 않는다(도배 방지).
  const updateSearch = useCallback(
    (q: string) => setQueryState({ q, page: FIRST_PAGE }, REPLACE_HISTORY),
    [setQueryState],
  );
  const setFilter = useCallback(
    (filter: ProductListFilter) =>
      setQueryState({ ...filter, page: FIRST_PAGE }),
    [setQueryState],
  );
  const setPage = useCallback(
    (page: number) => setQueryState({ page }),
    [setQueryState],
  );

  return {
    query,
    beginSearch,
    updateSearch,
    setFilter,
    setPage,
    clampPageToRange,
  };
}
