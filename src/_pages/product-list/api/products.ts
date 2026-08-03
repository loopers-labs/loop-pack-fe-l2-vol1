import type { ProductSort } from "./types";

export const PRODUCT_SORTS = [
  "latest",
  "popular",
  "price-asc",
  "price-desc",
] as const satisfies readonly ProductSort[];

export const isProductSort = (value: string): value is ProductSort =>
  PRODUCT_SORTS.some((sort) => sort === value);
