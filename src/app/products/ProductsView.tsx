"use client";
import { useQuery } from "@tanstack/react-query";
import { productListQueryOptions } from "@/features/commerce/queries";
import {
  categoryOptions,
  isCategoryValue,
  isSortValue,
  sortOptions,
  useProductListQuery,
} from "@/features/commerce/searchParams";
import { ProductCard } from "@/components/commerce/ProductCard";
import { SearchForm } from "@/components/commerce/SearchForm";

export function ProductsView() {
  const [params, setParams] = useProductListQuery();
  const productsQuery = useQuery(productListQueryOptions(params));

  const totalPages =
    productsQuery.status === "success"
      ? Math.max(1, Math.ceil(productsQuery.data.totalCount / productsQuery.data.pageSize))
      : 1;

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

      <section className="shop-section" aria-label="상품 검색 결과">
        {productsQuery.status === "pending" && (
          <p className="shop-state">상품을 불러오는 중입니다…</p>
        )}
        {productsQuery.status === "error" && (
          <p className="shop-state" role="alert">
            상품 목록을 불러오지 못했습니다.
          </p>
        )}
        {productsQuery.status === "success" &&
          (productsQuery.data.products.length === 0 ? (
            <p className="shop-empty">조건에 맞는 상품이 없습니다.</p>
          ) : (
            <>
              <p className="shop-total">총 {productsQuery.data.totalCount}개</p>
              <div className="shop-grid">
                {productsQuery.data.products.map((product) => (
                  <ProductCard key={product.id} product={product} />
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
            </>
          ))}
      </section>
    </main>
  );
}
