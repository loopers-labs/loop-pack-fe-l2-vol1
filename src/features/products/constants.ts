import { CATEGORY_IDS } from "@/constants/commerce";

export const PRODUCT_SORTS = ["latest", "popular", "price-asc", "price-desc"] as const;

export const PRODUCT_CATEGORY_FILTERS = ["all", ...CATEGORY_IDS] as const;

export const PRODUCT_LIST_PAGE_SIZE = 12;
