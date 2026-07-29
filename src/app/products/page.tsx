"use client";

import { Placeholder } from "@/app/_components/placeholder";
import { ProductGridSkeleton } from "@/app/_components/product-grid-skeleton";
import { ProductFilters } from "@/app/products/_components/product-filters";
import { ProductListResults } from "@/app/products/_components/product-list-results";
import { productSearchParsers } from "@/app/products/_lib/search-params";
import { commerceQueries } from "@/queries/commerce";
import { CommerceApiError } from "@/shared/api/commerce-client";
import { useQuery } from "@tanstack/react-query";
import { useQueryStates } from "nuqs";
import { Suspense } from "react";

function ProductListContent() {
  const [search, setSearch] = useQueryStates(productSearchParsers, {
    history: "push",
  });
  const {
    data: products,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery(commerceQueries.products(search));

  return (
    <>
      <section className="week05-section">
        <h1>상품 목록</h1>
        <ProductFilters search={search} onChange={setSearch} />
      </section>
      {isLoading ? (
        <section className="week05-section" aria-busy="true" aria-label="상품 목록 불러오는 중">
          <ProductGridSkeleton count={search.pageSize} />
        </section>
      ) : isError ? (
        <Placeholder
          role="alert"
          title="상품을 불러오지 못했어요"
          description={
            error instanceof CommerceApiError ? error.message : "잠시 후 다시 시도해 주세요."
          }
          action={
            <button type="button" onClick={() => refetch()}>
              다시 시도
            </button>
          }
        />
      ) : products === undefined ? null : (
        <ProductListResults
          result={products}
          page={search.page}
          onPageChange={(page) => setSearch({ page })}
        />
      )}
    </>
  );
}

export default function ProductListPage() {
  return (
    <Suspense
      fallback={
        <section className="week05-section" aria-busy="true" aria-label="상품 목록 불러오는 중">
          <ProductGridSkeleton />
        </section>
      }
    >
      <ProductListContent />
    </Suspense>
  );
}
