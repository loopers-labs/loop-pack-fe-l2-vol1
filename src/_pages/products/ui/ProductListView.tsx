"use client";

import { type ChangeEvent, useEffect, useState } from "react";

import { QueryErrorResetBoundary, useQueryClient } from "@tanstack/react-query";
import { useQueryStates } from "nuqs";

import { useShellProductList } from "@/_pages/products/api/useShellProductList";
import type { CategoryId, ProductSort } from "@/entities/product/model/types";
import { productListQueryOptions } from "@/features/products/api/queries";
import { type PageSize } from "@/features/products/model/pagination";
import { productSearchParsers } from "@/features/products/model/searchParams";
import {
  CATEGORY_OPTIONS,
  PAGE_SIZE_OPTIONS,
  SORT_OPTIONS,
} from "@/features/products/ui/filterOptions";
import { ErrorBoundary } from "@/shared/ui/error/ErrorBoundary";

import { ProductListResults } from "./ProductListResults";
import { ProductSearchInput } from "./ProductSearchInput";

export function ProductListView() {
  const [query, setQuery] = useQueryStates(productSearchParsers, { history: "push" });
  const queryClient = useQueryClient();
  // 전체 개수(totalCount)는 페이지네이션에만 쓰는 껍데기 정보라 껍데기 관찰자로 읽는다.
  // 결과 목록은 ProductListResults가 직접 조회하며, 같은 query key라 요청은 한 번만 나간다.
  const { data, isPlaceholderData } = useShellProductList(query);

  const totalCount = data?.totalCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / query.pageSize));

  // 초기화가 비제어 검색 인풋(defaultValue)까지 비우도록, 리셋 시 이 key를 올려 인풋을 리마운트한다.
  const [filterResetKey, setFilterResetKey] = useState(0);

  // 다음 페이지를 미리 받아 둔다. 진입만으로 투기적으로 받지 않고,
  // "다음"에 마우스를 올리거나(hover) 포커스가 닿았을 때(keyboard) — 곧 누를 의도가 드러난 시점에만 받는다.
  // 마지막 페이지에선 "다음"이 disabled라 이 이벤트가 뜨지 않아 없는 페이지를 요청하지 않는다.
  // staleTime 안이면 prefetchQuery가 캐시를 그대로 써, hover를 반복해도 요청이 중복되지 않는다.
  // 목록 조회와 같은 팩토리라 query key·캐시 정책이 그대로 일치해 충돌하지 않는다.
  function prefetchNextPage() {
    // 결과를 기다리지 않고 캐시만 채우므로 floating promise를 void로 명시한다.
    void queryClient.prefetchQuery(productListQueryOptions({ ...query, page: query.page + 1 }));
  }

  // 파서가 걸러낸 값(pageSize=999 등)은 조회에는 안 쓰이지만 주소창에는 그대로 남아,
  // URL이 실제 조회 조건과 다른 말을 한다. 정규화된 값으로 덮어써 둘을 맞춘다.
  // 잘못된 URL은 뒤로 가기로 돌아갈 지점이 아니므로 replace로 바꾼다.
  // 값이 이미 정규형이면 nuqs가 상태를 갱신하지 않아 이 effect는 다시 돌지 않는다.
  useEffect(() => {
    setQuery(query, { history: "replace" });
  }, [query, setQuery]);

  // 마지막 페이지를 넘는 page(전체 개수는 서버만 안다)는 서버 page.tsx가 응답으로 검사해
  // 첫 페이지로 redirect한다. 클라이언트는 유효한 page만 받으므로 여기서 되돌릴 필요가 없다.

  // 검색·카테고리·정렬을 바꾸면 이전 페이지가 유효하지 않으므로 page를 1로 되돌린다.
  // 한 객체로 넘겨 URL 쓰기가 한 번에 일어나게 한다(조회도 한 번).
  function handleSearch(q: string) {
    setQuery({ q, page: 1 });
  }

  function handleCategoryChange(event: ChangeEvent<HTMLSelectElement>) {
    setQuery({ category: event.target.value as CategoryId | "all", page: 1 });
  }

  function handleSortChange(event: ChangeEvent<HTMLSelectElement>) {
    setQuery({ sort: event.target.value as ProductSort, page: 1 });
  }

  // 개수를 바꾸면 기존 페이지 번호가 범위를 벗어날 수 있어 함께 1로 되돌린다.
  // 선택지를 PAGE_SIZE_VALUES로 그리므로 값은 항상 PageSize 중 하나다.
  function handlePageSizeChange(event: ChangeEvent<HTMLSelectElement>) {
    setQuery({ pageSize: Number(event.target.value) as PageSize, page: 1 });
  }

  function goToPage(page: number) {
    setQuery({ page });
  }

  // 검색·카테고리·정렬·페이지·표시개수를 기본값으로 되돌린다(URL에서 제거하면 파서 기본값으로).
  // 제어 select는 자동으로 되돌아가고, 비제어 검색 인풋은 key를 올려 리마운트로 비운다.
  function handleReset() {
    setQuery(null);
    setFilterResetKey((key) => key + 1);
  }

  return (
    <>
      <section className="week05-section">
        <h1>상품 목록</h1>
        <div className="week05-filters">
          <ProductSearchInput key={filterResetKey} value={query.q} onSearch={handleSearch} />
          <label>
            카테고리
            <select value={query.category} onChange={handleCategoryChange}>
              {CATEGORY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            정렬
            <select value={query.sort} onChange={handleSortChange}>
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            표시 개수
            <select value={query.pageSize} onChange={handlePageSizeChange}>
              {PAGE_SIZE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <button type="button" onClick={handleReset}>
            초기화
          </button>
        </div>
      </section>

      <section className="week05-section" aria-label="상품 검색 결과" aria-busy={isPlaceholderData}>
        {/* 첫 조회 5xx로 보여줄 데이터가 없으면 결과와 페이지네이션을 함께 경계 fallback으로 바꾼다.
            페이지네이션은 결과 집합 안의 이동이라 데이터와 운명을 같이한다(조건을 바꿔 재시도하는
            필터는 경계 밖에 있어 유지된다). reset은 쿼리 에러까지 지워 전체 새로고침 없이 다시 조회한다.
            4xx·네트워크·배경 실패는 던지지 않아 ProductListResults 안에서 인라인으로 처리된다. */}
        <QueryErrorResetBoundary>
          {({ reset }) => (
            <ErrorBoundary
              onReset={reset}
              fallback={({ reset }) => (
                <p role="alert">
                  상품을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.{" "}
                  <button type="button" onClick={reset}>
                    다시 시도
                  </button>
                </p>
              )}
            >
              <ProductListResults />
              {/* 페이지네이션은 이동할 결과가 있을 때만 보인다. 0건(빈 결과)이나 데이터 없는
                  최초 로딩에선 totalCount가 0이라 숨겨, "1 / 1"이 떠 결과가 있는 듯 보이지 않게 한다.
                  갱신 중엔 이전 데이터의 totalCount가 유지돼 그대로 보인다. */}
              {totalCount > 0 && (
                <nav className="week05-pagination" aria-label="페이지 이동">
                  <button
                    type="button"
                    onClick={() => goToPage(query.page - 1)}
                    disabled={query.page <= 1}
                  >
                    이전
                  </button>
                  <span>
                    {query.page} / {totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => goToPage(query.page + 1)}
                    onMouseEnter={prefetchNextPage}
                    onFocus={prefetchNextPage}
                    disabled={query.page >= totalPages}
                  >
                    다음
                  </button>
                </nav>
              )}
            </ErrorBoundary>
          )}
        </QueryErrorResetBoundary>
      </section>
    </>
  );
}
