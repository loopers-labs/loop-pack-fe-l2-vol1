"use client";

import { useQueryStates } from "nuqs";
import { useCallback } from "react";
import { productListSearchParams } from "./searchParams";
import type { ProductCategoryFilter, ProductSort } from "./types";

export function useProductListSearchParams() {
  const [params, setParams] = useQueryStates(productListSearchParams, {
    history: "push",
  });

  const setSearchQuery = useCallback(
    (q: string) => {
      void setParams({ q, page: 1 });
    },
    [setParams],
  );

  const setCategory = useCallback(
    (category: ProductCategoryFilter) => {
      void setParams({ category, page: 1 });
    },
    [setParams],
  );

  const setSort = useCallback(
    (sort: ProductSort) => {
      void setParams({ sort, page: 1 });
    },
    [setParams],
  );

  const setPage = useCallback(
    (page: number) => {
      void setParams({ page });
    },
    [setParams],
  );

  const replacePage = useCallback(
    (page: number) => {
      void setParams({ page }, { history: "replace" });
    },
    [setParams],
  );

  const resetFilters = useCallback(() => {
    void setParams({
      q: "",
      category: "all",
      sort: "latest",
      page: 1,
    });
  }, [setParams]);

  return {
    params,
    setSearchQuery,
    setCategory,
    setSort,
    setPage,
    replacePage,
    resetFilters,
  };
}
