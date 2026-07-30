import type { ProductListQuery, ProductListResponse } from "@/types/commerce";
import { getBaseUrl } from "@/services/getBaseUrl";
import { requestJson } from "@/services/requestJson";
import { buildProductListSearchParams } from "../model/productListQuery";

export function getProducts(
  query: ProductListQuery,
): Promise<ProductListResponse> {
  const params = buildProductListSearchParams(query);

  return requestJson<ProductListResponse>(
    `${getBaseUrl()}/api/products?${params.toString()}`,
  );
}
