import type { PRODUCT_CATEGORY_FILTERS, PRODUCT_SORTS } from "./constants";

export type ProductCategoryFilter = (typeof PRODUCT_CATEGORY_FILTERS)[number];

export type ProductSort = (typeof PRODUCT_SORTS)[number];
