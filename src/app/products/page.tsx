'use client';
import { Suspense } from 'react';
import { Header } from '@/components/Header';
import { ProductCard } from '@/components/ProductCard';
import { useProductFilters } from '@/hooks/useProductFilters';

export default function ProductListPage() {
  return (
    <Suspense>
      <ProductListContent />
    </Suspense>
  );
}

function ProductListContent() {
  const {
    filters,
    setFilters,
    searchInput,
    handleSearchChange,
    data,
    isLoading,
    isError,
    refetch,
    totalPages,
  } = useProductFilters();

  return (
    <main className="week05-page">
      <Header />
      <section className="week05-section">
        <h1>상품 목록</h1>
        <form className="week05-filters" onSubmit={(e) => e.preventDefault()}>
          <label>
            검색
            <input
              name="q"
              placeholder="상품명 또는 브랜드"
              value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
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
        {isLoading && <p>로딩 중...</p>}
        {isError && (
          <div className="week05-error">
            <p>오류가 발생했습니다.</p>
            <button type="button" onClick={() => void refetch()}>
              다시 시도
            </button>
          </div>
        )}
        {!isLoading && !isError && (
          <>
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
          </>
        )}
      </section>
    </main>
  );
}
