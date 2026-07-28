import { createApiUrl, parseApiError, setSearchParam } from "@/shared/api/apiUtils";
import type { Category, Product } from "@/types/commerce";
import type { ProductCategoryFilter, ProductSort } from "../types";

export type ProductListQuery = {
  q?: string;
  category?: ProductCategoryFilter;
  sort?: ProductSort;
  page?: number;
  pageSize?: number;
};

export type ProductListResponse = {
  products: Product[];
  categories: Category[];
  totalCount: number;
  page: number;
  pageSize: number;
};

export async function getProducts(params: ProductListQuery = {}): Promise<ProductListResponse> {
  const searchParams = new URLSearchParams();

  setSearchParam(searchParams, "q", params.q);
  setSearchParam(searchParams, "category", params.category);
  setSearchParam(searchParams, "sort", params.sort);
  setSearchParam(searchParams, "page", params.page);
  setSearchParam(searchParams, "pageSize", params.pageSize);

  const queryString = searchParams.toString();
  const apiPath = `/api/products${queryString ? `?${queryString}` : ""}`;
  const response = await fetch(createApiUrl(apiPath));

  if (!response.ok) {
    throw await parseApiError(response, "상품 목록을 불러오지 못했습니다.");
  }

  return response.json() as Promise<ProductListResponse>;
}
