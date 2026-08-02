import type { Category, CategoryId, Product } from "@/entities/product";

export type ProductSort = "latest" | "popular" | "price-asc" | "price-desc";

export type MockApiScenario = "empty" | "error";

export type ProductListQuery = {
  q: string;
  category: CategoryId | "all";
  sort: ProductSort;
  page: number;
  pageSize: number;
};

export type HomeResponse = {
  banner: { title: string; description: string; image: string };
  categories: Category[];
  popularProducts: Product[];
  newProducts: Product[];
};

export type ProductListResponse = {
  products: Product[];
  categories: Category[];
  totalCount: number;
  page: number;
  pageSize: number;
};

export type { ApiErrorResponse } from "@/shared/api";
