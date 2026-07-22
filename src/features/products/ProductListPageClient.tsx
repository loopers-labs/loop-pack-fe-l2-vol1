"use client";

import { ProductFilters } from "./ProductFilters";
import { ProductListResults } from "./ProductListResults";
import { useProductListSearchParams } from "./useProductListSearchParams";

export function ProductListPageClient() {
  const { params, setSearchQuery, setCategory, setSort, setPage, replacePage, resetFilters } =
    useProductListSearchParams();

  return (
    <>
      <section className="mt-8">
        <h1 className="mb-5 text-3xl font-bold tracking-tight text-gds-gray-900">상품 목록</h1>
        <ProductFilters
          q={params.q}
          category={params.category}
          sort={params.sort}
          onSearchChange={setSearchQuery}
          onCategoryChange={setCategory}
          onSortChange={setSort}
          onReset={resetFilters}
        />
      </section>

      <section className="mt-8" aria-label="상품 검색 결과">
        <ProductListResults params={params} onPageChange={setPage} onPageReplace={replacePage} />
      </section>
    </>
  );
}
