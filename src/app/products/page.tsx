'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Suspense, type SubmitEvent } from 'react';

import { ProductCard } from '@/features/products/ProductCard';
import {
  CATEGORY_FILTER_LABEL,
  CATEGORY_FILTERS,
  PRODUCT_PAGE_SIZE,
  PRODUCT_SORT_LABEL,
  type CategoryFilter,
} from '@/features/products/constants';
import { productQueries } from '@/features/products/queries';
import { useProductListUrlState } from '@/features/products/search-params';
import { PRODUCT_SORTS, type ProductSort } from '@/types/commerce';

export default function ProductsPage() {
  return (
    <main className="week05-page">
      <header className="week05-header">
        <Link href="/">Commerce</Link>
        <nav aria-label="주요 메뉴">
          <Link href="/products">상품</Link>
        </nav>
      </header>

      <section className="week05-section" aria-label="상품 검색 결과">
        <h1>상품 목록</h1>

        <Suspense fallback={<LoadingStatus />}>
          <ProductSearchForm />
          <ProductListFilters />
          <ProductList />
        </Suspense>
      </section>
    </main>
  );
}

function LoadingStatus() {
  return (
    <p className="week05-status" role="status">
      상품 목록을 불러오는 중입니다…
    </p>
  );
}

function ProductSearchForm() {
  const [{ q }, setConditions] = useProductListUrlState();

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();

    const keyword = String(new FormData(event.currentTarget).get('q') ?? '');

    void setConditions({ q: keyword.trim() || null, page: 1 });
  };

  return (
    <form key={q} className="week05-filters" onSubmit={handleSubmit}>
      <label>
        검색
        <input name="q" defaultValue={q} placeholder="상품명 또는 브랜드" />
      </label>
      <button type="submit">검색</button>
    </form>
  );
}

function ProductListFilters() {
  const [{ category, sort }, setConditions] = useProductListUrlState();

  return (
    <div className="week05-filters">
      <label>
        카테고리
        <select
          value={category}
          onChange={(event) => {
            void setConditions({
              category: event.target.value as CategoryFilter,
              page: 1,
            });
          }}
        >
          {CATEGORY_FILTERS.map((value) => (
            <option key={value} value={value}>
              {CATEGORY_FILTER_LABEL[value]}
            </option>
          ))}
        </select>
      </label>
      <label>
        정렬
        <select
          value={sort}
          onChange={(event) => {
            void setConditions({
              sort: event.target.value as ProductSort,
              page: 1,
            });
          }}
        >
          {PRODUCT_SORTS.map((value) => (
            <option key={value} value={value}>
              {PRODUCT_SORT_LABEL[value]}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

function ProductList() {
  const [{ q, category, sort, page }] = useProductListUrlState();
  // FIXME: useSuspenseQuery 고려
  const { data, isPending, isError, error } = useQuery(
    productQueries.list({
      q,
      category,
      sort,
      page,
      pageSize: PRODUCT_PAGE_SIZE,
    }),
  );

  if (isPending) return <LoadingStatus />;

  if (isError) {
    return (
      <p className="week05-status" role="alert">
        {error.message}
      </p>
    );
  }

  return (
    <>
      <p>총 {data.totalCount}개</p>
      {data.totalCount === 0 ? (
        <p className="week05-empty">조건에 맞는 상품이 없습니다.</p>
      ) : (
        <div className="week05-grid">
          {data.products.map((product) => (
            <ProductCard key={product.id} product={product} headingLevel="h2" />
          ))}
        </div>
      )}
    </>
  );
}
