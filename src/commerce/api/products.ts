import { categories, products } from "./catalog";
import type { CategoryId } from "@/entities/product";
import type { ProductListResponse, ProductSort } from "./types";

// 정렬·카테고리 유효값은 도메인 지식이므로 피처가 소유하고, 어댑터(route)가 검증에 재사용한다.
export const PRODUCT_SORTS = [
  "latest",
  "popular",
  "price-asc",
  "price-desc",
] as const satisfies readonly ProductSort[];

export const isProductSort = (value: string): value is ProductSort =>
  PRODUCT_SORTS.some((sort) => sort === value);

type ProductQuery = {
  q: string;
  category: CategoryId | "all";
  sort: ProductSort | null;
  page: number;
  pageSize: number;
};

// 검증된 쿼리로 mock DB를 검색·정렬·페이지네이션한다(순수 도메인).
export function queryProducts({
  q,
  category,
  sort,
  page,
  pageSize,
}: ProductQuery): ProductListResponse {
  const needle = q.trim().toLocaleLowerCase("ko");

  const filtered = products.filter((product) => {
    const matchesCategory = category === "all" || product.category === category;
    const searchable = `${product.brand} ${product.name}`.toLocaleLowerCase("ko");
    return matchesCategory && searchable.includes(needle);
  });

  const sorted =
    sort === null
      ? filtered
      : [...filtered].sort((a, b) => {
          switch (sort) {
            case "popular":
              return b.reviewCount - a.reviewCount || b.rating - a.rating;
            case "price-asc":
              return a.price - b.price;
            case "price-desc":
              return b.price - a.price;
            case "latest":
              return Date.parse(b.createdAt) - Date.parse(a.createdAt);
          }
        });

  const start = (page - 1) * pageSize;

  return {
    products: sorted.slice(start, start + pageSize),
    categories,
    totalCount: filtered.length,
    page,
    pageSize,
  };
}
