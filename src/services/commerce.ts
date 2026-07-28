import type {
  HomeResponse,
  ProductListQuery,
  ProductListResponse,
} from "@/types/commerce";
import { buildProductListSearchParams } from "@/utils/productList";
import { getBaseUrl } from "./getBaseUrl";
import { requestJson } from "./requestJson";

export function getHome(): Promise<HomeResponse> {
  return requestJson<HomeResponse>(`${getBaseUrl()}/api/home`);
}

export function getProducts(
  query: ProductListQuery,
): Promise<ProductListResponse> {
  const params = buildProductListSearchParams(query);

  return requestJson<ProductListResponse>(
    `${getBaseUrl()}/api/products?${params.toString()}`,
  );
}
