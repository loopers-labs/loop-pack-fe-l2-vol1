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
import { ApiError } from '@/shared/api/fetcher';
import { useProductPage } from '../model/useProductPage';
import { useProductList } from '../model/useProductList';
import { Product } from '@/entities/product/model';

// [AI] TanStack Query v5의 error는 unknown 타입이므로 ApiError로 좁혀서 진짜 메시지를 꺼낸다.
// ApiError가 아니면(예: 네트워크 단절) 기본 메시지로 대체한다.
const getFailureReason = (error: unknown): string => {
  if (error instanceof ApiError) return error.message;
  if (error instanceof TypeError) return '네트워크 연결을 확인해 주세요.';
  return '상품을 불러오지 못했습니다.';
};

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
  const { data, isPending, isError, error, isPlaceholderData, totalPages, totalCount, refetch } =
    useProductList(page, query);

  // [AI] 상태를 "전체 교체형"과 "오버레이형"으로 분류한다.
  // - 전체 교체(영역을 통째로 바꿈): data가 아예 없을 때만 → 최초 진입(skeleton), 최초 실패(에러 전체화면)
  // - 오버레이(목록 위에 얹음): data가 있을 때 → 갱신 중(refresh-bar), 갱신 실패(에러 알림 + 기존 목록)
  // isError와 error는 같은 신호(error truthy ⟺ isError true)라, isError로 먼저 return하면
  // 갱신 실패 분기가 dead code가 된다. 그래서 "data 유무"를 전체 교체의 유일한 기준으로 쓴다.
  const renderResults = () => {
    // 1) data가 없을 때만 전체 교체
    if (!data) {
      if (isPending)
        return (
          <div className="grid">
            {Array.from({ length: PAGE_SIZE }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        );
      // [AI] 최초 실패 — 데이터가 아예 없는 상태에서의 실패.
      // 500은 throwOnError로 app/error.tsx가 담당하므로 여기는 주로 4xx/네트워크.
      if (isError)
        return (
          <p role="alert">
            {getFailureReason(error)}{' '}
            <button type="button" onClick={() => refetch()}>
              다시 시도
            </button>
          </p>
        );
      return null;
    }

    // 2) data가 있으면(성공/placeholder) 목록을 항상 그리고, 상태는 그 위에 오버레이.
    return (
      // [AI] .results를 relative로 두고, isPlaceholderData일 때 상단에 얇은 막대를 absolute로 띄운다.
      // absolute라 기존 목록을 비우거나 밀지 않아 갱신 중에도 레이아웃이 안정적이다(CLS 방지).
      <div className="results">
        {isPlaceholderData && <div className="refresh-bar" role="status" aria-label="갱신 중" />}
        {/* [AI] 갱신 실패 — 기존 목록은 유지한 채 에러 알림과 재시도만 얹는다. */}
        {isError ? (
          <p role="alert">
            {getErrorMessage(error)} 이전 목록을 보여드려요.{' '}
            <button type="button" onClick={() => refetch()}>
              다시 시도
            </button>
          </p>
        ) : (
          <p>총 {totalCount.toLocaleString()}개</p>
        )}
        {data.products.length === 0 ? (
          <p>
            category: {category}, searchInput: {searchInput}에 대한 검색 결과가 없습니다.
          </p>
        ) : (
          <div className="grid">
            {data.products.map((product: Product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
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
