import { useEffect, useMemo, useState } from "react";
import type { ProductCategory, ProductCategoryFilter, SortBy } from "../types";

const PRODUCT_CATEGORIES = ["electronics", "fashion", "home", "beauty"] as const;
const SORT_VALUES = ["latest", "popular", "price-asc", "price-desc"] as const;

const DEFAULT_CATEGORY: ProductCategoryFilter = "all";
const DEFAULT_SORT: SortBy = "latest";
const DEFAULT_PAGE = 1;

type QueryParamValue = string | number | "";
type HistoryMode = "push" | "replace";

function isProductCategory(value: string): value is ProductCategory {
  return (PRODUCT_CATEGORIES as readonly string[]).includes(value);
}

function isSortBy(value: string): value is SortBy {
  return (SORT_VALUES as readonly string[]).includes(value);
}

function parseCategoryParam(value: string | null): ProductCategoryFilter {
  if (value === null) {
    return DEFAULT_CATEGORY;
  }

  return isProductCategory(value) ? value : DEFAULT_CATEGORY;
}

function parseSortParam(value: string | null): SortBy {
  if (value === null) {
    return DEFAULT_SORT;
  }

  return isSortBy(value) ? value : DEFAULT_SORT;
}

function parseNumberParam(value: string | null): number | "" {
  if (value === null || value === "") {
    return "";
  }

  const parsed = Number(value);
  return Number.isNaN(parsed) ? "" : parsed;
}

function parsePageParam(value: string | null): number {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 1) {
    return DEFAULT_PAGE;
  }

  return parsed;
}

export function useProductListQueryParams() {
  const [search, setSearch] = useState(window.location.search);

  const queryParams = useMemo(() => {
    const params = new URLSearchParams(search);

    return {
      category: parseCategoryParam(params.get("category")),
      searchQuery: params.get("q") ?? "",
      page: parsePageParam(params.get("page")),
      sortBy: parseSortParam(params.get("sort")),
      minPrice: parseNumberParam(params.get("minPrice")),
      maxPrice: parseNumberParam(params.get("maxPrice")),
      inStockOnly: params.get("inStock") === "true",
    };
  }, [search]);

  const updateSearch = (updater: (params: URLSearchParams) => void, mode: HistoryMode = "push") => {
    const params = new URLSearchParams(search);
    updater(params);

    const nextSearch = params.toString();
    const nextUrl = `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ""}`;
    const currentUrl = `${window.location.pathname}${window.location.search}`;

    if (nextUrl === currentUrl) {
      return;
    }

    if (mode === "replace") {
      window.history.replaceState(null, "", nextUrl);
    } else {
      window.history.pushState(null, "", nextUrl);
    }

    setSearch(window.location.search);
  };

  const setQueryParam = (
    params: URLSearchParams,
    key: string,
    value: QueryParamValue,
    defaultValue: QueryParamValue = "",
  ) => {
    if (value === defaultValue) {
      params.delete(key);
      return;
    }

    params.set(key, String(value));
  };

  const updateFilterParam = (
    key: string,
    value: QueryParamValue,
    defaultValue: QueryParamValue = "",
  ) => {
    updateSearch((params) => {
      setQueryParam(params, key, value, defaultValue);
      params.delete("page");
    });
  };

  const setCategory = (category: ProductCategoryFilter) => {
    updateFilterParam("category", category, DEFAULT_CATEGORY);
  };

  const setSearchQuery = (query: string) => {
    updateFilterParam("q", query);
  };

  const setSortBy = (sortBy: SortBy) => {
    updateFilterParam("sort", sortBy, DEFAULT_SORT);
  };

  const setMinPrice = (minPrice: number | "") => {
    updateFilterParam("minPrice", minPrice);
  };

  const setMaxPrice = (maxPrice: number | "") => {
    updateFilterParam("maxPrice", maxPrice);
  };

  const setInStockOnly = (inStockOnly: boolean) => {
    updateFilterParam("inStock", inStockOnly ? "true" : "");
  };

  const setPage = (page: number, mode: HistoryMode = "push") => {
    updateSearch((params) => {
      setQueryParam(params, "page", page <= DEFAULT_PAGE ? DEFAULT_PAGE : page, DEFAULT_PAGE);
    }, mode);
  };

  const resetQueryParams = () => {
    const nextUrl = window.location.pathname;
    const currentUrl = `${window.location.pathname}${window.location.search}`;

    if (nextUrl === currentUrl) {
      return;
    }

    window.history.pushState(null, "", nextUrl);
    setSearch(window.location.search);
  };

  useEffect(() => {
    const handlePopState = () => {
      setSearch(window.location.search);
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  return {
    ...queryParams,
    setCategory,
    setSearchQuery,
    setSortBy,
    setMinPrice,
    setMaxPrice,
    setInStockOnly,
    setPage,
    resetQueryParams,
  };
}
