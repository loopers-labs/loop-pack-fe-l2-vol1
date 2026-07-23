"use client";

import { Placeholder } from "@/app/_components/placeholder";
import { ProductGridSkeleton } from "@/app/_components/product-grid-skeleton";
import { CartButton, WishlistButton } from "@/app/_components/product-actions";
import { ProductSearchInput } from "@/app/products/_components/product-search-input";
import { commerceQueries } from "@/queries/commerce";
import { CommerceApiError } from "@/services/commerce";
import type { CategoryId } from "@/types/commerce";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import {
  createParser,
  parseAsNumberLiteral,
  parseAsString,
  parseAsStringLiteral,
  useQueryStates,
} from "nuqs";
import { Suspense } from "react";

const parseAsPositiveInteger = createParser({
  parse: (value) => {
    const parsed = Number.parseInt(value, 10);
    if (!Number.isSafeInteger(parsed) || parsed < 1) {
      return null;
    }
    return parsed;
  },
  serialize: (value) => String(value),
});

const pageSizeValues = [6, 12, 24] as const;
const categoryFilterValues = [
  "all",
  "casual",
  "fashion",
  "goods",
  "home",
  "digital",
] as const satisfies readonly ("all" | CategoryId)[];

const productSearchParsers = {
  q: parseAsString.withDefault(""),
  category: parseAsStringLiteral(categoryFilterValues).withDefault("all"),
  sort: parseAsStringLiteral(["latest", "popular", "price-asc", "price-desc"] as const).withDefault(
    "latest",
  ),
  page: parseAsPositiveInteger.withDefault(1),
  pageSize: parseAsNumberLiteral(pageSizeValues).withDefault(12),
};

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

  const filterSection = (
    <section className="week05-section">
      <h1>상품 목록</h1>
      <div className="week05-filters">
        <ProductSearchInput value={search.q} onDebouncedChange={(q) => setSearch({ q, page: 1 })} />
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
            {(products?.categories ?? []).map((category) => (
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
        <label>
          페이지 크기
          <select
            name="pageSize"
            value={search.pageSize}
            onChange={(event) =>
              setSearch({
                pageSize: Number(event.target.value) as (typeof search)["pageSize"],
                page: 1,
              })
            }
          >
            {pageSizeValues.map((size) => (
              <option key={size} value={size}>
                {size}개씩
              </option>
            ))}
          </select>
        </label>
      </div>
    </section>
  );

  if (isLoading) {
    return (
      <>
        {filterSection}
        <section className="week05-section" aria-busy="true" aria-label="상품 목록 불러오는 중">
          <ProductGridSkeleton count={search.pageSize} />
        </section>
      </>
    );
  }

  if (isError) {
    return (
      <>
        {filterSection}
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
      </>
    );
  }

  if (products === undefined) {
    return filterSection;
  }

  const totalPages = Math.max(1, Math.ceil(products.totalCount / products.pageSize));

  return (
    <>
      {filterSection}
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
              {products.products.map((product) => (
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
                    <WishlistButton productId={product.id} label={product.name} />
                    <CartButton productId={product.id} label={product.name} />
                  </div>
                </article>
              ))}
            </div>
            <nav className="week05-pagination" aria-label="페이지 이동">
              <button
                type="button"
                disabled={search.page <= 1}
                onClick={() => setSearch({ page: search.page - 1 })}
              >
                이전
              </button>
              <span>
                {search.page} / {totalPages}
              </span>
              <button
                type="button"
                disabled={search.page >= totalPages}
                onClick={() => setSearch({ page: search.page + 1 })}
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
