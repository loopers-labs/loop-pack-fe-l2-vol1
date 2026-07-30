import { queryOptions } from "@tanstack/react-query";
import type {
  ApiErrorResponse,
  CategoryId,
  HomeResponse,
  ProductListResponse,
  ProductSort,
} from "@/types/commerce";

// URL(nuqs)에서 기본값이 채워진 뒤의 조회 조건. scenario는 사용자 상태가 아니므로 제외.
export type ResolvedProductListQuery = {
  q: string;
  category: CategoryId | "all";
  sort: ProductSort;
  page: number;
};

// API 에러 응답 좁히기 — as 없이 타입 가드로 message를 확보.
const isApiErrorResponse = (value: unknown): value is ApiErrorResponse => {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  return "message" in value && typeof value.message === "string";
};

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    const body: unknown = await response.json().catch(() => null);
    const message = isApiErrorResponse(body) ? body.message : "요청을 처리하지 못했습니다.";
    throw new Error(message);
  }
  return response.json();
}

// 홈은 자주 바뀌지 않는 카탈로그성 데이터 → 오래 신선하게 둔다.
const HOME_STALE_TIME = 5 * 60 * 1000;
const HOME_GC_TIME = 10 * 60 * 1000;
// 목록은 조건별 결과라 더 짧게. 같은 조건 재방문/앞뒤 이동엔 캐시가 즉시 응답.
const LIST_STALE_TIME = 60 * 1000;

export function homeQueryOptions() {
  return queryOptions({
    queryKey: ["home"],
    queryFn: () => fetchJson<HomeResponse>("/api/home"),
    staleTime: HOME_STALE_TIME,
    gcTime: HOME_GC_TIME,
  });
}

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
    queryKey: ["products", query],
    queryFn: () => fetchJson<ProductListResponse>(`/api/products?${params.toString()}`),
    staleTime: LIST_STALE_TIME,
  });
}
