"use client";

import { ProductGridSkeleton } from "@/entities/product";
import { CommerceApiError } from "@/shared/api/commerce-client";
import { Placeholder } from "@/shared/ui/placeholder";
import { useQuery } from "@tanstack/react-query";
import { useQueryStates } from "nuqs";
import { productListQueries } from "../api/queries";
import { productSearchParsers } from "../lib/search-params";
import { ProductFilters } from "./product-filters";
import { ProductListResults } from "./product-list-results";

export function ProductListContent() {
  const [search, setSearch] = useQueryStates(productSearchParsers, {
    history: "push",
  });
  const { data, isPending, isFetching, isError, error, refetch } = useQuery(
    productListQueries.list(search),
  );

  const errorMessage =
    error instanceof CommerceApiError ? error.message : "잠시 후 다시 시도해 주세요.";

  return (
    <>
      <section className="week05-section">
        <h1>상품 목록</h1>
        <ProductFilters search={search} onChange={setSearch} />
      </section>
      {isPending ? (
        <section className="week05-section" aria-busy="true" aria-label="상품 목록 불러오는 중">
          <ProductGridSkeleton count={search.pageSize} />
        </section>
      ) : isError && data === undefined ? (
        <Placeholder
          role="alert"
          title="상품을 불러오지 못했어요"
          description={errorMessage}
          action={
            <button type="button" onClick={() => refetch()}>
              다시 시도
            </button>
          }
        />
      ) : data === undefined ? null : (
        <>
          <p role={isError && !isFetching ? "alert" : "status"} aria-live="polite">
            {isFetching ? (
              "목록을 갱신하는 중…"
            ) : isError ? (
              <span>
                목록을 갱신하지 못했어요 ({errorMessage}){" "}
                <button type="button" onClick={() => refetch()}>
                  다시 시도
                </button>
              </span>
            ) : (
              <span aria-hidden="true" style={{ visibility: "hidden" }}>
                목록을 갱신하는 중…
              </span>
            )}
          </p>
          <ProductListResults
            result={data}
            page={search.page}
            onPageChange={(page) => setSearch({ page })}
          />
        </>
      )}
    </>
  );
}
