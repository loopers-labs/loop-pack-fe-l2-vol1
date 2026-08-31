import { createApiUrl, parseApiError, setSearchParam } from "@/shared/api/apiUtils";
import type { Category } from "@/entities/category";
import type { CategoryId } from "@/entities/category";
import type { Product, ProductSort } from "@/entities/product";
import type { ProductListScenario } from "../model/types";

export type ProductListQuery = {
  q?: string;
  category?: CategoryId | "all";
  sort?: ProductSort;
  page?: number;
  pageSize?: number;
  scenario?: ProductListScenario;
};

export type ProductListResponse = {
  products: Product[];
  categories: Category[];
  totalCount: number;
  page: number;
  pageSize: number;
};

type ProductListRequestOptions = {
  signal?: AbortSignal;
};

export async function getProducts(
  params: ProductListQuery = {},
  options: ProductListRequestOptions = {},
): Promise<ProductListResponse> {
  const searchParams = new URLSearchParams();

  setSearchParam(searchParams, "q", params.q);
  setSearchParam(searchParams, "category", params.category);
  setSearchParam(searchParams, "sort", params.sort);
  setSearchParam(searchParams, "page", params.page);
  setSearchParam(searchParams, "pageSize", params.pageSize);
  setSearchParam(searchParams, "scenario", params.scenario ?? undefined);

  const queryString = searchParams.toString();
  const apiPath = `/api/products${queryString ? `?${queryString}` : ""}`;
  const apiUrl = createApiUrl(apiPath);
  const response =
    options.signal === undefined
      ? await fetch(apiUrl)
      : await fetch(apiUrl, { signal: options.signal });

  if (!response.ok) {
    throw await parseApiError(response, "상품 목록을 불러오지 못했습니다.");
  }

  return response.json() as Promise<ProductListResponse>;
}
