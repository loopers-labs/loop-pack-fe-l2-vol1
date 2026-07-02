import type { Product, ProductCategoryFilter, SortBy } from "../types";

export type GetProductsParams = {
  category: ProductCategoryFilter;
  q: string;
  page: number;
  sort: SortBy;
  minPrice: number | "";
  maxPrice: number | "";
  size: number;
};

export type GetProductsResponse = {
  products: Product[];
  totalCount: number;
};

export async function getProducts(
  params: GetProductsParams,
  options?: { signal?: AbortSignal },
): Promise<GetProductsResponse> {
  const searchParams = new URLSearchParams();

  if (params.category !== "all") {
    searchParams.set("category", params.category);
  }

  if (params.q) {
    searchParams.set("q", params.q);
  }

  searchParams.set("page", String(params.page));
  searchParams.set("size", String(params.size));
  searchParams.set("sort", params.sort);

  if (params.minPrice !== "") {
    searchParams.set("minPrice", String(params.minPrice));
  }

  if (params.maxPrice !== "") {
    searchParams.set("maxPrice", String(params.maxPrice));
  }

  const response = await fetch(`/api/products?${searchParams.toString()}`, {
    signal: options?.signal,
  });

  if (!response.ok) {
    throw new Error("상품 목록을 불러오지 못했습니다.");
  }

  return response.json() as Promise<GetProductsResponse>;
}
