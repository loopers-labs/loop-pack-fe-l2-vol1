import { parseApiError, setSearchParam } from "@/lib/apiUtils";
import type { MockApiScenario, ProductListQuery, ProductListResponse } from "@/types/commerce";

type GetProductsParams = ProductListQuery & {
  scenario?: MockApiScenario;
};

export async function getProducts(params: GetProductsParams = {}): Promise<ProductListResponse> {
  const searchParams = new URLSearchParams();

  setSearchParam(searchParams, "q", params.q);
  setSearchParam(searchParams, "category", params.category);
  setSearchParam(searchParams, "sort", params.sort);
  setSearchParam(searchParams, "page", params.page);
  setSearchParam(searchParams, "pageSize", params.pageSize);
  setSearchParam(searchParams, "scenario", params.scenario);

  const queryString = searchParams.toString();
  const response = await fetch(`/api/products${queryString ? `?${queryString}` : ""}`);

  if (!response.ok) {
    throw await parseApiError(response, "상품 목록을 불러오지 못했습니다.");
  }

  return response.json() as Promise<ProductListResponse>;
}
