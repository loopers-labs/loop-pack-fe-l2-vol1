'use client';

// [AI] 상품 목록 페이지 조합(widget). URL 필터 + 상품 데이터 + 카드 조합 + prefetch + 상태 분기를 담당.
// app/products/page.tsx는 이 위젯을 얇게 호출하기만 한다.
import {
  isCategoryValue,
  isSortValue,
  PAGE_SIZE,
} from '@/features/product-filters/model/useProductListFilters';
import { Header } from '@/widgets/header/Header';
import { ProductCard } from '@/widgets/product-card/ProductCard';
import { SkeletonCard } from '@/shared/ui/SkeletonCard';
import { useProductPage } from '../model/useProductPage';
import { useProductList } from '../model/useProductList';
import { Product } from '@/entities/product/model';

export const ProductList = () => {
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
  const { data, isPending, isError, isPlaceholderData, totalPages, totalCount, refetch } =
    useProductList(page, query);

  const renderResults = () => {
    if (isPending)
      return (
        <div className="grid">
          {Array.from({ length: PAGE_SIZE }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      );

    if (isError)
      return (
        <p role="alert">
          상품을 불러오지 못했습니다.{' '}
          <button type="button" onClick={() => refetch()}>
            다시 시도
          </button>
        </p>
      );
    if (data?.products.length === 0) {
      return (
        <p>
          category: {category}, searchInput: {searchInput}에 대한 검색 결과가 없습니다.
        </p>
      );
    }

    return (
      // [AI] .results를 relative로 두고, isPlaceholderData일 때 상단에 얇은 막대를 absolute로 띄운다.
      // absolute라 기존 목록을 비우거나 밀지 않아 갱신 중에도 레이아웃이 안정적이다(CLS 방지).
      <div className="results">
        {isPlaceholderData && <div className="refresh-bar" role="status" aria-label="갱신 중" />}
        <p>총 {totalCount.toLocaleString()}개</p>
        <div className="grid">
          {data?.products.map((product: Product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
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
