import { queryOptions } from "@tanstack/react-query";
import type { Product, ProductListResponse } from "@/types/commerce";
import { fetchCommerceApi } from "@/shared/api/commerce-client";

// 목록 API 의 pageSize 상한은 24, mock 상품은 30개다. 두 페이지를 합쳐 전체를 만든다
const CATALOG_PAGE_SIZE = 24;
const CATALOG_PAGES = 2;

async function getCatalog(): Promise<Product[]> {
  const pages = await Promise.all(
    Array.from({ length: CATALOG_PAGES }, (_, index) =>
      fetchCommerceApi<ProductListResponse>(
        `/api/products?category=all&sort=latest&page=${index + 1}&pageSize=${CATALOG_PAGE_SIZE}`,
      ),
    ),
  );
  return pages.flatMap((page) => page.products);
}

export const productCatalogQueries = {
  all: () =>
    queryOptions({
      queryKey: ["products", "catalog"] as const,
      queryFn: getCatalog,
      staleTime: 5 * 60 * 1000,
    }),
};

export const indexProductsById = (products: Product[]) =>
  new Map(products.map((product) => [product.id, product]));
