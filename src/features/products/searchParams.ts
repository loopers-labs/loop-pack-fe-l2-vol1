import { parseAsInteger, parseAsString, parseAsStringEnum } from "nuqs";
import { PRODUCT_CATEGORY_FILTERS, PRODUCT_SORTS } from "./constants";
import type { ProductCategoryFilter, ProductSort } from "./types";

export const productListSearchParams = {
  q: parseAsString.withDefault(""),
  category: parseAsStringEnum<ProductCategoryFilter>([...PRODUCT_CATEGORY_FILTERS]).withDefault(
    "all",
  ),
  sort: parseAsStringEnum<ProductSort>([...PRODUCT_SORTS]).withDefault("latest"),
  page: parseAsInteger.withDefault(1),
};
