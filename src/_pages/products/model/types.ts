import type { ProductSort } from "@/entities/product";
import type { PRODUCT_CATEGORY_FILTERS, PRODUCT_LIST_SCENARIOS } from "./constants";

export type ProductCategoryFilter = (typeof PRODUCT_CATEGORY_FILTERS)[number];
export type ProductListScenario = (typeof PRODUCT_LIST_SCENARIOS)[number] | null;

export type { ProductSort };
