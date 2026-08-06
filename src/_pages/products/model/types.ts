import type { ProductSort } from "@/entities/product";
import type { PRODUCT_CATEGORY_FILTERS } from "./constants";

export type ProductCategoryFilter = (typeof PRODUCT_CATEGORY_FILTERS)[number];

export type { ProductSort };
