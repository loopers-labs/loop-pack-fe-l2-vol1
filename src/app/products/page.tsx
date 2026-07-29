'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { productQueries } from '@/features/product/api/queries';
import {
  PAGE_SIZE,
  isCategoryValue,
  isSortValue,
} from '@/features/product/hooks/useProductListFilters';
import { Header } from '@/widgets/Header';
import { ProductCard } from '@/features/product/ui/ProductCard';
import { Suspense, useEffect } from 'react';
import { useProductPage } from './products.hook';

// [AI] nuqs URL 상태 + productQueries로 검색·카테고리·정렬·페이지네이션을 구동.
const ProductsView = () => {
  const {
    category,
    sort,
    page,
    searchInput,
    setCategory,
    setSort,
    setPage,
    setSearchInput,
    query,
  } = useProductPage();
  const { data, isPending, isError, refetch } = useQuery(productQueries.list(query));

  const totalCount = data?.totalCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / (data?.pageSize ?? PAGE_SIZE)));

  const queryClient = useQueryClient();
  useEffect(() => {
    if (page >= totalPages) return;
    const nextQuery = { ...query, page: page + 1 };
    queryClient.prefetchQuery(productQueries.list(nextQuery));
  });

  const renderResults = () => {
    if (isPending) return <p>불러오는 중...</p>;
    if (isError)
      return (
        <p role="alert">
          상품을 불러오지 못했습니다.{' '}
          <button type="button" onClick={() => refetch()}>
            다시 시도
          </button>
        </p>
      );
    if (data.products.length === 0) return <p>검색 결과가 없습니다.</p>;

    return (
      <>
        <p>총 {totalCount.toLocaleString()}개</p>
        <div className="grid">
          {data.products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </>
    );
  };

  return (
    <main className="page">
      <Header />
      <section className="section">
        <h1>상품 목록</h1>
        <form className="filters" onSubmit={(event) => event.preventDefault()}>
          <label>
            검색
            <input
              name="q"
              placeholder="상품명 또는 브랜드"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
            />
          </label>
          <label>
            카테고리
            <select
              name="category"
              value={category}
              onChange={(event) => {
                if (isCategoryValue(event.target.value)) {
                  setCategory(event.target.value);
                }
              }}
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
              name="sort"
              value={sort}
              onChange={(event) => {
                if (isSortValue(event.target.value)) {
                  setSort(event.target.value);
                }
              }}
            >
              <option value="latest">최신순</option>
              <option value="popular">인기순</option>
              <option value="price-asc">가격 낮은순</option>
              <option value="price-desc">가격 높은순</option>
            </select>
          </label>
        </form>
      </section>
      <section className="section" aria-label="상품 검색 결과">
        {renderResults()}
        <nav className="pagination" aria-label="페이지 이동">
          <button type="button" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            이전
          </button>
          <span>
            {page} / {totalPages}
          </span>
          <button type="button" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
            다음
          </button>
        </nav>
      </section>
    </main>
  );
};

// [AI] useQueryStates(nuqs)가 내부적으로 useSearchParams()를 호출하므로
// 빌드 시 정적 프리렌더에는 Suspense 경계가 필요하다(CSR bailout 방지).
const ProductsPage = () => (
  <Suspense>
    <ProductsView />
  </Suspense>
);

export default ProductsPage;
