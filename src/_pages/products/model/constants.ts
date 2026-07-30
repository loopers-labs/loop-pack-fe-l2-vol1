import { CATEGORY_IDS } from "@/entities/category";

export { PRODUCT_SORTS } from "@/entities/product";

export const PRODUCT_CATEGORY_FILTERS = ["all", ...CATEGORY_IDS] as const;

export const PRODUCT_LIST_PAGE_SIZE = 12;
