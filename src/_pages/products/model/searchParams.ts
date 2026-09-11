import { createLoader, createParser, parseAsString, parseAsStringEnum } from "nuqs/server";
import { PRODUCT_CATEGORY_FILTERS, PRODUCT_LIST_SCENARIOS, PRODUCT_SORTS } from "./constants";
import type { ProductSort } from "@/entities/product";
import type { ProductCategoryFilter, ProductListScenario } from "./types";
import type { SearchParams } from "nuqs/server";

const parseAsPageNumber = createParser({
  parse(value) {
    const parsed = Number(value);

    if (!Number.isInteger(parsed) || parsed < 1) {
      return null;
    }

    return parsed;
  },
  serialize(value) {
    return String(value);
  },
});

export const productListSearchParams = {
  q: parseAsString.withDefault(""),
  category: parseAsStringEnum<ProductCategoryFilter>([...PRODUCT_CATEGORY_FILTERS]).withDefault(
    "all",
  ),
  sort: parseAsStringEnum<ProductSort>([...PRODUCT_SORTS]).withDefault("latest"),
  page: parseAsPageNumber.withDefault(1),
};

export const productListScenarioSearchParams = {
  scenario: parseAsStringEnum<Exclude<ProductListScenario, null>>([...PRODUCT_LIST_SCENARIOS]),
};

export const loadProductListSearchParams = createLoader(productListSearchParams);

const loadProductListQuerySearchParams = createLoader({
  ...productListSearchParams,
  ...productListScenarioSearchParams,
});

export const loadProductListQueryParams = (searchParams: Promise<SearchParams>) =>
  loadProductListQuerySearchParams(searchParams);
