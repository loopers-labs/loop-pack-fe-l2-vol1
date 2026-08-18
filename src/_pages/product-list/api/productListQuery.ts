import { keepPreviousData, queryOptions } from "@tanstack/react-query";
import type { ProductListResponse } from "@/entities/product";
import { fetchJson, isServerFault } from "@/shared/api";
import type { ResolvedProductListQuery } from "../model/useProductListQuery";

// 목록은 조건별 결과라 짧게. 같은 조건 재방문/앞뒤 이동엔 캐시가 즉시 응답.
// gcTime은 기본 5분을 그대로 쓴다 — 근거는 docs/week-05-design.md.
const LIST_STALE_TIME = 60 * 1000;

export function productListQueryOptions(query: ResolvedProductListQuery) {
  const params = new URLSearchParams();
  if (query.q !== "") {
    params.set("q", query.q);
  }
  // 기본값(all·latest)도 API에는 명시한다 — sort 생략은 4주차 호환용 동작이므로.
  params.set("category", query.category);
  params.set("sort", query.sort);
  params.set("page", String(query.page));

  return queryOptions({
    // 조건 전체를 key에 담아 조건별로 캐시를 분리한다.
    // ⚠️ 이 key 모양이 바뀌면 캐시 동일성이 깨진다(기준선 #8).
    queryKey: ["products", query],
    // signal을 넘겨 조건을 빠르게 바꿀 때 이전 요청이 실제로 끊기게 한다.
    queryFn: ({ signal }) =>
      fetchJson<ProductListResponse>(`/api/products?${params.toString()}`, signal),
    staleTime: LIST_STALE_TIME,
    // 조건이 바뀌어도 이전 결과를 두고 그 위에서 갱신한다 —
    // 목록을 비웠다 채우면 사용자가 매번 빈 화면을 보고 레이아웃도 흔들린다.
    placeholderData: keepPreviousData,
    // 5xx·네트워크는 경계로, 4xx는 화면 안에서. 조건을 바꿔 벗어날 수 있는 실패만 인라인이다.
    throwOnError: (error) => isServerFault(error),
  });
}
