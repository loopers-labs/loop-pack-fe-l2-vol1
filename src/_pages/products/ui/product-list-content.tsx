"use client";

import { ProductGridSkeleton } from "@/entities/product";
import { CommerceApiError } from "@/shared/api/commerce-client";
import { Placeholder } from "@/shared/ui/placeholder";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useQueryStates } from "nuqs";
import type { ProductListResponse } from "@/types/commerce";
import { productListQueries } from "../api/queries";
import { productSearchParsers } from "../lib/search-params";
import { ProductFilters } from "./product-filters";
import { ProductListResults } from "./product-list-results";

export function ProductListContent() {
  const [search, setSearch] = useQueryStates(productSearchParsers, {
    history: "push",
  });
  const queryClient = useQueryClient();
  const { data, isPending, isFetching, isError, error, refetch } = useQuery(
    productListQueries.list(search),
  );

  // 갱신 실패 시 기존 목록 유지: 캐시에서 가장 최근 성공 응답을 읽는다 (로컬 복사 없음)
  const staleResult =
    isError && data === undefined
      ? (queryClient
          .getQueryCache()
          .findAll({ queryKey: ["products"] })
          .filter((query) => query.state.status === "success" && query.state.data !== undefined)
          .sort((a, b) => b.state.dataUpdatedAt - a.state.dataUpdatedAt)[0]?.state.data as
          ProductListResponse | undefined)
      : undefined;
  const result = data ?? staleResult;

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
      ) : isError && result === undefined ? (
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
      ) : result === undefined ? null : (
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
            result={result}
            page={search.page}
            onPageChange={(page) => setSearch({ page })}
          />
        </>
      )}
    </>
  );
}
