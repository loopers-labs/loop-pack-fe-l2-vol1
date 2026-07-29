'use client';

import { Suspense, useState, type FormEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import { productQueries } from '@/features/products/products.queries';
import { useProductFilters } from '@/features/products/useProductFilters';
import { SiteHeader } from '@/components/SiteHeader';
import { ProductGrid } from '@/components/ProductGrid';
import type { ProductListQuery } from '@/types/commerce';
import '@/examples/week-05-layout/week-05-layout.css';

function ProductsResult({
  filters,
  onPageChange,
}: {
  filters: ProductListQuery;
  onPageChange: (page: number) => void;
}) {
  const { data, isPending, isError, refetch } = useQuery(
    productQueries.list(filters),
  );

  if (isPending) return <p>불러오는 중…</p>;

  if (isError)
    return (
      <div role="alert">
        <p>상품을 불러오지 못했어요.</p>
        <button type="button" onClick={() => void refetch()}>
          다시 시도
        </button>
      </div>
    );

  if (data.products.length === 0) return <p>조건에 맞는 상품이 없어요.</p>;

  const totalPages = Math.max(1, Math.ceil(data.totalCount / data.pageSize));

  return (
    <>
      <p>총 {data.totalCount}개</p>
      <ProductGrid products={data.products} />
      <nav className="week05-pagination" aria-label="페이지 이동">
        <button
          type="button"
          disabled={data.page <= 1}
          onClick={() => onPageChange(data.page - 1)}
        >
          이전
        </button>
        <span>
          {data.page} / {totalPages}
        </span>
        <button
          type="button"
          disabled={data.page >= totalPages}
          onClick={() => onPageChange(data.page + 1)}
        >
          다음
        </button>
      </nav>
    </>
  );
}

function SearchForm({
  initialValue,
  onSearch,
}: {
  initialValue: string;
  onSearch: (q: string) => void;
}) {
  const [keyword, setKeyword] = useState(initialValue);

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    onSearch(keyword);
  };

  return (
    <form onSubmit={onSubmit}>
      <label>
        검색
        <input
          name="q"
          placeholder="상품명 또는 브랜드"
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
        />
      </label>
    </form>
  );
}

// useProductFilters(내부 useSearchParams)는 정적 프리렌더 시 Suspense 경계가 필요하다.
export default function ProductsPage() {
  return (
    <Suspense fallback={<p>불러오는 중…</p>}>
      <ProductsPageContent />
    </Suspense>
  );
}

function ProductsPageContent() {
  const { filters, setSearch, setCategory, setSort, setPage } =
    useProductFilters();

  return (
    <main className="week05-page">
      <SiteHeader />

      <section className="week05-section">
        <h1>상품 목록</h1>
        <div className="week05-filters">
          <SearchForm
            key={filters.q}
            initialValue={filters.q}
            onSearch={setSearch}
          />
          <label>
            카테고리
            <select
              value={filters.category}
              onChange={(event) => setCategory(event.target.value)}
            >
              <option value="all">전체</option>
              <option value="casual">캐주얼</option>
              <option value="fashion">패션</option>
              <option value="goods">뷰티·잡화</option>
              <option value="home">홈</option>
              <option value="digital">디지털</option>
            </select>
          </label>
          <label>
            정렬
            <select
              value={filters.sort}
              onChange={(event) => setSort(event.target.value)}
            >
              <option value="latest">최신순</option>
              <option value="popular">인기순</option>
              <option value="price-asc">가격 낮은순</option>
              <option value="price-desc">가격 높은순</option>
            </select>
          </label>
        </div>
      </section>

      <section className="week05-section" aria-label="상품 검색 결과">
        <ProductsResult filters={filters} onPageChange={setPage} />
      </section>
    </main>
  );
}
