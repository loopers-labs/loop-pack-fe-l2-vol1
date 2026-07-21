import type {
  ApiErrorResponse,
  HomeResponse,
  ProductListQuery,
  ProductListResponse,
} from "@/types/commerce";

export type ProductListParams = Required<ProductListQuery>;

export class CommerceApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "CommerceApiError";
    this.status = status;
  }
}

export async function fetchCommerceApi<TData>(url: string): Promise<TData> {
  const response = await fetch(url);

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as ApiErrorResponse | null;
    throw new CommerceApiError(body?.message ?? "요청을 처리하지 못했습니다.", response.status);
  }

  return (await response.json()) as TData;
}

export function getHome(): Promise<HomeResponse> {
  return fetchCommerceApi<HomeResponse>("/api/home");
}

export function getProducts(params: ProductListParams): Promise<ProductListResponse> {
  const searchParams = new URLSearchParams({
    category: params.category,
    sort: params.sort,
    page: String(params.page),
    pageSize: String(params.pageSize),
  });

  const q = params.q.trim();
  if (q !== "") {
    searchParams.set("q", q);
  }

  return fetchCommerceApi<ProductListResponse>(`/api/products?${searchParams.toString()}`);
}
