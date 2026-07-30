import { getBaseUrl, requestJson } from "@/shared/api";
import type { Category, Product, ProductListQuery } from "../model/product";
import { buildProductListSearchParams } from "../model/productListQuery";

export type ProductListResponse = {
  products: Product[];
  categories: Category[];
  totalCount: number;
  page: number;
  pageSize: number;
};

export function getProducts(
  query: ProductListQuery,
): Promise<ProductListResponse> {
  const params = buildProductListSearchParams(query);

  return requestJson<ProductListResponse>(
    `${getBaseUrl()}/api/products?${params.toString()}`,
  );
}
