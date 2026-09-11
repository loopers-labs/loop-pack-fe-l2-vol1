"use client";

import { useCallback, useEffect, useRef } from "react";
import { ProductFilters } from "./ProductFilters";
import { ProductListResults } from "./ProductListResults";
import { useProductListSearchParams } from "../model/useProductListSearchParams";
import {
  trackCategoryFilterChange,
  trackPageChange,
  trackProductListView,
  trackSortChange,
} from "@/analytics/commerceEvents";
import type { ProductCategoryFilter, ProductSort } from "../model/types";

export function ProductListPageClient() {
  const productListTopRef = useRef<HTMLElement>(null);
  const { params, setSearchQuery, setCategory, setSort, setPage, replacePage, resetFilters } =
    useProductListSearchParams();
  const { q, category, sort, page } = params;

  useEffect(() => {
    trackProductListView({ q, category, sort, page });
  }, [category, page, q, sort]);

  const handleCategoryChange = useCallback(
    (category: ProductCategoryFilter) => {
      trackCategoryFilterChange({ category });
      setCategory(category);
    },
    [setCategory],
  );

  const handleSortChange = useCallback(
    (sort: ProductSort) => {
      trackSortChange({ sort });
      setSort(sort);
    },
    [setSort],
  );

  const handlePageChange = useCallback(
    (page: number) => {
      trackPageChange({ page });
      setPage(page);
      productListTopRef.current?.scrollIntoView({ block: "start" });
    },
    [setPage],
  );

  return (
    <>
      <section ref={productListTopRef} className="mt-8 scroll-mt-6">
        <h1 className="mb-5 text-3xl font-bold tracking-tight text-gds-gray-900">상품 목록</h1>
        <ProductFilters
          q={params.q}
          category={params.category}
          sort={params.sort}
          onSearchChange={setSearchQuery}
          onCategoryChange={handleCategoryChange}
          onSortChange={handleSortChange}
          onReset={resetFilters}
        />
      </section>

      <section className="mt-8" aria-label="상품 검색 결과">
        <ProductListResults
          params={params}
          onPageChange={handlePageChange}
          onPageReplace={replacePage}
        />
      </section>
    </>
  );
}
