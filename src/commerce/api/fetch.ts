import type {
  ApiErrorResponse,
  HomeResponse,
  ProductListQuery,
  ProductListResponse,
} from "./types";

// res.ok가 false면 throw한다 — TanStack Query가 이 throw를 받아 error 상태로 전환한다.
async function fetchJson<T>(input: string): Promise<T> {
  const res = await fetch(input);

  if (!res.ok) {
    const error: ApiErrorResponse = await res.json();
    throw new Error(error.message);
  }

  const body: T = await res.json();
  return body;
}

export function fetchHome(): Promise<HomeResponse> {
  return fetchJson<HomeResponse>("/api/home");
}

// 파싱된 5필드만 재직렬화한다 — location.search를 그대로 넘기면 raw 값(예: page=01)이
// 라우트 검증(app/api/products/route.ts)에 걸려 400이 난다. scenario는 절대 보내지 않는다.
export function fetchProductList(query: ProductListQuery): Promise<ProductListResponse> {
  const params = new URLSearchParams({
    q: query.q,
    category: query.category,
    sort: query.sort,
    page: String(query.page),
    pageSize: String(query.pageSize),
  });

  return fetchJson<ProductListResponse>(`/api/products?${params.toString()}`);
}
