import { useEffect, useMemo, useState } from "react";
import type { ProductCategory, ProductCategoryFilter, SortBy } from "../types";

const PRODUCT_CATEGORIES = ["electronics", "fashion", "home", "beauty"] as const;
const SORT_VALUES = ["latest", "popular", "price-asc", "price-desc"] as const;

const DEFAULT_CATEGORY: ProductCategoryFilter = "all";
const DEFAULT_SORT: SortBy = "latest";
const DEFAULT_PAGE = 1;

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

  const replaceSearch = (updater: (params: URLSearchParams) => void) => {
    const params = new URLSearchParams(search);
    updater(params);

    const nextSearch = params.toString();
    const nextUrl = nextSearch ? `?${nextSearch}` : window.location.pathname;

    window.history.replaceState(null, "", nextUrl);
    setSearch(window.location.search);
  };

  const setCategory = (category: ProductCategoryFilter) => {
    replaceSearch((params) => {
      if (category === DEFAULT_CATEGORY) {
        params.delete("category");
      } else {
        params.set("category", category);
      }

      params.delete("page");
    });
  };

  const setSearchQuery = (query: string) => {
    replaceSearch((params) => {
      if (query) {
        params.set("q", query);
      } else {
        params.delete("q");
      }

      params.delete("page");
    });
  };

  const setSortBy = (sortBy: SortBy) => {
    replaceSearch((params) => {
      if (sortBy === DEFAULT_SORT) {
        params.delete("sort");
      } else {
        params.set("sort", sortBy);
      }

      params.delete("page");
    });
  };

  const setMinPrice = (minPrice: number | "") => {
    replaceSearch((params) => {
      if (minPrice === "") {
        params.delete("minPrice");
      } else {
        params.set("minPrice", String(minPrice));
      }

      params.delete("page");
    });
  };

  const setMaxPrice = (maxPrice: number | "") => {
    replaceSearch((params) => {
      if (maxPrice === "") {
        params.delete("maxPrice");
      } else {
        params.set("maxPrice", String(maxPrice));
      }

      params.delete("page");
    });
  };

  const setInStockOnly = (inStockOnly: boolean) => {
    replaceSearch((params) => {
      if (inStockOnly) {
        params.set("inStock", "true");
      } else {
        params.delete("inStock");
      }

      params.delete("page");
    });
  };

  const setPage = (page: number) => {
    replaceSearch((params) => {
      if (page <= DEFAULT_PAGE) {
        params.delete("page");
      } else {
        params.set("page", String(page));
      }
    });
  };

  const resetQueryParams = () => {
    window.history.replaceState(null, "", window.location.pathname);
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
