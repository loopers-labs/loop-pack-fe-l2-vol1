"use client";

import { Placeholder } from "@/app/_components/placeholder";
import { ProductGridSkeleton } from "@/app/_components/product-grid-skeleton";
import { ProductSearchInput } from "@/app/products/_components/product-search-input";
import { commerceQueries } from "@/queries/commerce";
import { CommerceApiError } from "@/services/commerce";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import { parseAsInteger, parseAsString, parseAsStringLiteral, useQueryStates } from "nuqs";

const productSearchParsers = {
  q: parseAsString.withDefault(""),
  category: parseAsStringLiteral([
    "all",
    "casual",
    "fashion",
    "goods",
    "home",
    "digital",
  ] as const).withDefault("all"),
  sort: parseAsStringLiteral(["latest", "popular", "price-asc", "price-desc"] as const).withDefault(
    "latest",
  ),
  page: parseAsInteger.withDefault(1),
  pageSize: parseAsInteger.withDefault(20),
};

export default function ProductListPage() {
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

  if (isLoading) {
    return (
      <section className="week05-section" aria-busy="true" aria-label="상품 목록 불러오는 중">
        <ProductGridSkeleton count={search.pageSize} />
      </section>
    );
  }

  if (isError) {
    return (
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
    );
  }

  if (products === undefined) {
    return null;
  }

  const totalPages = Math.max(1, Math.ceil(products.totalCount / products.pageSize));

  return (
    <>
      <section className="week05-section">
        <h1>상품 목록</h1>
        <form className="week05-filters">
          <ProductSearchInput
            initialValue={search.q}
            onDebouncedChange={(q) => setSearch({ q, page: 1 })}
          />
          <label>
            카테고리
            <select
              name="category"
              value={search.category}
              onChange={(event) =>
                setSearch({
                  category: event.target.value as (typeof search)["category"],
                  page: 1,
                })
              }
            >
              <option value="all">전체</option>
              {products.categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            정렬
            <select
              name="sort"
              value={search.sort}
              onChange={(event) =>
                setSearch({
                  sort: event.target.value as (typeof search)["sort"],
                  page: 1,
                })
              }
            >
              <option value="latest">최신순</option>
              <option value="popular">인기순</option>
              <option value="price-asc">낮은 가격순</option>
              <option value="price-desc">높은 가격순</option>
            </select>
          </label>
        </form>
      </section>
      <section className="week05-section" aria-label="상품 검색 결과">
        <p>총 {products.totalCount}개</p>
        {products.products.length === 0 ? (
          <Placeholder
            title="검색 결과가 없어요"
            description="다른 검색어나 카테고리·정렬을 선택해 보세요."
          />
        ) : (
          <>
            <div className="week05-grid">
              {products.products.map((product, index) => (
                <article className="week05-product" key={product.id}>
                  <Image
                    className="week05-image"
                    src={product.image}
                    alt={product.name}
                    width={400}
                    height={400}
                  />
                  <p>{product.brand}</p>
                  <h2>{product.name}</h2>
                  <strong>{product.price.toLocaleString()}원</strong>
                  <div>
                    <button
                      type="button"
                      aria-label={`${index + 1}번 상품 위시리스트`}
                      aria-pressed={false}
                    >
                      찜
                    </button>
                    <button
                      type="button"
                      aria-label={`${index + 1}번 상품 장바구니`}
                      aria-pressed={false}
                    >
                      담기
                    </button>
                  </div>
                </article>
              ))}
            </div>
            <nav className="week05-pagination" aria-label="페이지 이동">
              <button
                type="button"
                disabled={products.page <= 1}
                onClick={() => setSearch({ page: products.page - 1 })}
              >
                이전
              </button>
              <span>
                {products.page} / {totalPages}
              </span>
              <button
                type="button"
                disabled={products.page >= totalPages}
                onClick={() => setSearch({ page: products.page + 1 })}
              >
                다음
              </button>
            </nav>
          </>
        )}
      </section>
    </>
  );
}
