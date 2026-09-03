"use client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import type { ProductListResponse } from "@/entities/product";
import { ProductCardWithActions } from "@/widgets/product-card";
import { productListQueryOptions } from "../api/productListQuery";
import { categoryOptions, isCategoryValue, isSortValue, sortOptions } from "../config/options";
import { useProductListQuery } from "../model/useProductListQuery";
import { ProductListSkeleton } from "./ProductListSkeleton";
import { SearchForm } from "./SearchForm";
import type { ResolvedProductListQuery } from "../model/useProductListQuery";

// 0건 화면은 "왜 0건인지"를 URL 조건 그대로 보여줘야 다음 행동을 고를 수 있다.
function describeQuery(query: ResolvedProductListQuery) {
  const parts: string[] = [];
  if (query.q !== "") {
    parts.push(`검색어 "${query.q}"`);
  }
  if (query.category !== "all") {
    const category = categoryOptions.find((option) => option.id === query.category);
    parts.push(`카테고리 ${category?.name ?? query.category}`);
  }
  if (query.page > 1) {
    parts.push(`${query.page}페이지`);
  }
  return parts.length === 0 ? "전체 조건" : parts.join(" · ");
}

export function ProductListPage() {
  const [params, setParams] = useProductListQuery();
  const productsQuery = useQuery(productListQueryOptions(params));
  const queryClient = useQueryClient();

  // placeholderData는 새 조건의 요청이 "실패"하면 버려진다 — 그대로 두면 갱신 실패가
  // 최초 실패처럼 보이고 보고 있던 목록이 사라진다.
  // 그래서 마지막으로 성공한 "조건"만 기억하고, 데이터는 캐시에서 읽는다.
  // 서버 응답을 로컬 상태로 복사하지 않는다 — 여기 담기는 건 URL에서 온 조건뿐이다.
  const [lastLoadedParams, setLastLoadedParams] = useState(params);
  const isFresh = productsQuery.isSuccess && !productsQuery.isPlaceholderData;
  if (isFresh && lastLoadedParams !== params) {
    // 렌더 중 상태 조정(React가 허용하는 패턴) — effect로 미루면 한 프레임 어긋난다.
    setLastLoadedParams(params);
  }

  const cachedList = queryClient.getQueryData<ProductListResponse>(
    productListQueryOptions(lastLoadedParams).queryKey,
  );

  // 화면을 가르는 건 status 하나가 아니라 "지금 보여줄 목록이 있는가"다.
  const list = productsQuery.data ?? cachedList;
  const hasList = list !== undefined;
  // `!hasList`가 붙어야 최초 로딩과 목록이 배타적이다. `isPending`만 보면 배타성이
  // placeholderData 옵션에 딸린 우연이 된다 — 8주차 3단계에서 그 옵션을 지웠을 때
  // 스켈레톤 12칸과 카드 12장이 함께 그려졌다(M7). 옵션이 아니라 화면 상태로 가른다.
  // 이 줄이 `aria-busy`도 함께 고친다. 아래 section의 aria-busy는 최초 로딩 전용
  // 신호이고, 갱신은 role="status" 문구가 따로 알린다.
  const isFirstLoad = !hasList && productsQuery.isPending;
  const isUpdating = productsQuery.isFetching && hasList;
  const updateFailed = productsQuery.isError && hasList;
  const firstLoadFailed = productsQuery.isError && !hasList;

  const totalPages = hasList ? Math.max(1, Math.ceil(list.totalCount / list.pageSize)) : 1;

  return (
    <main className="shop-page">
      <section className="shop-section">
        <h1>상품 목록</h1>
        <div className="shop-filters">
          {/* URL q가 바뀌면 key로 초안을 리셋. 제출 시 검색·page=1로 승격. */}
          <SearchForm
            key={params.q}
            initialQuery={params.q}
            onSubmit={(value) => setParams({ q: value === "" ? null : value, page: 1 })}
          />
          <label>
            카테고리
            <select
              value={params.category}
              onChange={(event) => {
                // 필터 변경 시 page를 1로 되돌린다.
                if (isCategoryValue(event.target.value)) {
                  setParams({ category: event.target.value, page: 1 });
                }
              }}
            >
              {categoryOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            정렬
            <select
              value={params.sort}
              onChange={(event) => {
                if (isSortValue(event.target.value)) {
                  setParams({ sort: event.target.value, page: 1 });
                }
              }}
            >
              {sortOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      {/* aria-busy는 "읽을 콘텐츠가 아직 없다"는 뜻이라 최초 로딩에만 켠다.
          갱신 중에는 이전 목록이 그대로 읽히므로 busy가 아니고, 진행 중이라는 사실은
          아래 role="status"가 알린다. 둘을 한 신호에 담으면 보조기술이 가를 수 없다. */}
      <section className="shop-section" aria-label="상품 검색 결과" aria-busy={isFirstLoad}>
        {/* ① 데이터 없는 최초 진입 — 실제 목록 크기를 예상할 수 있게 같은 수·모양으로 자리를 잡는다. */}
        {isFirstLoad && (
          <>
            <p className="shop-state">상품을 불러오는 중입니다…</p>
            <ProductListSkeleton />
          </>
        )}

        {/* ④ 최초 실패 — 보여줄 목록이 없으므로 목록 자리에 실패 이유와 재시도를 둔다.
            여기 오는 건 4xx뿐이다(5xx·네트워크는 throwOnError로 error.tsx가 받는다). */}
        {firstLoadFailed && (
          <div className="shop-state" role="alert">
            <p>상품 목록을 불러오지 못했습니다. 검색 조건을 확인해 주세요.</p>
            <button type="button" onClick={() => void productsQuery.refetch()}>
              다시 시도
            </button>
          </div>
        )}

        {hasList && (
          <>
            {/* ⑤ 갱신 실패 — 기존 목록은 그대로 두고 실패와 재시도만 위에 얹는다. */}
            {updateFailed && (
              <div className="shop-notice shop-notice-error" role="alert">
                <span>목록을 갱신하지 못했습니다. 아래는 마지막으로 불러온 결과입니다.</span>
                <button type="button" onClick={() => void productsQuery.refetch()}>
                  다시 시도
                </button>
              </div>
            )}

            {/* ② 이전 데이터가 있는 갱신 — 목록을 비우지 않고 갱신 중임을 알린다.
                ⑥ 취소된 이전 요청은 여기 걸리지 않는다(에러로 올라오지 않고, 현재 화면도 덮지 않는다). */}
            {isUpdating && !updateFailed && (
              <p className="shop-notice" role="status">
                목록을 갱신하는 중입니다…
              </p>
            )}

            {list.products.length === 0 ? (
              /* ③ 성공 + 0건 — 무엇으로 걸러서 0건인지 URL 조건을 그대로 적는다. */
              <p className="shop-empty">{describeQuery(params)}에 맞는 상품이 없습니다. (0개)</p>
            ) : (
              <div className={isUpdating ? "shop-list shop-list-updating" : "shop-list"}>
                <p className="shop-total">총 {list.totalCount}개</p>
                <div className="shop-grid">
                  {list.products.map((product) => (
                    <ProductCardWithActions key={product.id} product={product} />
                  ))}
                </div>
                <nav className="shop-pagination" aria-label="페이지 이동">
                  <button
                    type="button"
                    disabled={params.page <= 1}
                    onClick={() => setParams({ page: params.page - 1 })}
                  >
                    이전
                  </button>
                  <span>
                    {params.page} / {totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={params.page >= totalPages}
                    onClick={() => setParams({ page: params.page + 1 })}
                  >
                    다음
                  </button>
                </nav>
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}
