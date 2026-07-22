"use client";

import { ProductSearchInput } from "@/app/products/_components/product-search-input";
import { getProducts } from "@/services/commerce";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
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

/**
 * 5주차 과제를 빠르게 시작할 수 있도록 제공하는 최소 레이아웃 예시입니다.
 * 이 구조는 상태관리 아키텍처의 정답이 아닙니다.
 * 그대로 사용하거나, 기존 컴포넌트를 재사용하거나, 자유롭게 교체해도 됩니다.
 * 데이터 조회, Query 구성, 전역 상태와 이벤트 연결은 포함되어 있지 않습니다.
 * 실제 상태를 연결할 때 각 버튼의 aria-pressed를 해당 상품의 포함 여부로 바꿉니다.
 */
export default function ProductListPage() {
  const [search, setSearch] = useQueryStates(productSearchParsers);
  const { data: products, isLoading } = useQuery({
    queryKey: ["products", search],
    queryFn: () => getProducts(search),
    placeholderData: keepPreviousData,
  });

  if (products === undefined || isLoading) {
    return <div></div>;
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
      </section>
    </>
  );
}
