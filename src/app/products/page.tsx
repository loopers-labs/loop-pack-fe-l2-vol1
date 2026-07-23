'use client';
import { Suspense, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Header } from '@/components/Header';
import { ProductCard } from '@/components/ProductCard';
import {
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
  useQueryStates,
} from 'nuqs';
import { productsQueries } from '@/queries/productsQueries';
import { DEBOUNCE_DELAY } from '@/constants/time';

const categoryValues = [
  'all',
  'casual',
  'fashion',
  'goods',
  'home',
  'digital',
] as const;
const sortValues = ['latest', 'popular', 'price-asc', 'price-desc'] as const;

export default function ProductListPage() {
  return (
    <Suspense>
      <ProductListContent />
    </Suspense>
  );
}

function ProductListContent() {
  const [filters, setFilters] = useQueryStates(
    {
      q: parseAsString.withDefault(''),
      category: parseAsStringLiteral(categoryValues).withDefault('all'),
      sort: parseAsStringLiteral(sortValues).withDefault('latest'),
      page: parseAsInteger.withDefault(1),
    },
    { history: 'push' },
  );

  // 검색 입력은 로컬 state로 관리 — 300ms 후 URL 업데이트
  const [searchInput, setSearchInput] = useState(filters.q);

  useEffect(() => {
    const timer = setTimeout(() => {
      void setFilters({ q: searchInput, page: 1 });
    }, DEBOUNCE_DELAY);
    return () => clearTimeout(timer);
  }, [searchInput, setFilters]);

  const { data, isLoading, isError } = useQuery(
    productsQueries.productList(filters),
  );

  const totalPages = data ? Math.ceil(data.totalCount / data.pageSize) : 1;

  if (isLoading) return <p>로딩 중...</p>;
  if (isError) return <p>오류가 발생했습니다.</p>;

  return (
    <main className="week05-page">
      <Header />
      <section className="week05-section">
        <h1>상품 목록</h1>
        <form className="week05-filters">
          <label>
            검색
            <input
              name="q"
              placeholder="상품명 또는 브랜드"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </label>
          <label>
            카테고리
            <select
              name="category"
              value={filters.category}
              onChange={(e) =>
                setFilters({
                  category: e.target.value as typeof filters.category,
                  page: 1,
                })
              }
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
              value={filters.sort}
              onChange={(e) =>
                setFilters({
                  sort: e.target.value as typeof filters.sort,
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
        <p>총 {data?.totalCount ?? 0}개</p>
        <div className="week05-grid">
          {data?.products.length === 0 && <p>상품이 없습니다.</p>}
          {data?.products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
        <nav className="week05-pagination" aria-label="페이지 이동">
          <button
            type="button"
            disabled={filters.page <= 1}
            onClick={() => setFilters({ page: filters.page - 1 })}
          >
            이전
          </button>
          <span>
            {filters.page} / {totalPages}
          </span>
          <button
            type="button"
            disabled={filters.page >= totalPages}
            onClick={() => setFilters({ page: filters.page + 1 })}
          >
            다음
          </button>
        </nav>
      </section>
    </main>
  );
}
