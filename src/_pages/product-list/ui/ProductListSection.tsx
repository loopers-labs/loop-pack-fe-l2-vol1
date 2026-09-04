'use client';

import { useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { trackCategoryFilterChange, trackPageChange, trackProductListView, trackSortChange } from '@/analytics/events';
import SearchInput from './SearchInput';
import ProductGridSkeleton from './ProductGridSkeleton';
import { useProductListFilters } from '../model/useProductListFilters';
import { CATEGORY_OPTIONS, PRODUCT_PAGE_SIZE, SORT_LABELS, SORT_OPTIONS } from '../model/productListConstants';
import { resolvePageOverflow } from '../lib/resolvePageOverflow';
import { productQueries } from '../api/productQueries';
import { findLastSuccessfulProductList } from '../api/findLastSuccessfulProductList';
import { ApiError } from '@/shared/api/apiFetch';
import { ProductCardWithActions } from '@/widgets/product-card';
import type { CategoryId, Product, ProductSort } from '@/entities/product';

interface ProductResultsProps {
  products: Product[];
  page: number;
  totalPages: number;
  isStale: boolean;
  onPageChange: (value: number) => void;
}

// AI 생성: <select>의 onChange가 넘겨주는 값은 string이라 그대로 세터에 전달할 수 없다. 프로젝트가 as 단언을 금지하므로 타입 가드로 좁힌다.
function isCategoryOption(value: string): value is CategoryId | 'all' {
  return CATEGORY_OPTIONS.some((option) => option === value);
}

// AI 생성: 위와 같은 이유로 정렬 값도 타입 가드로 좁힌다.
function isSortOption(value: string): value is ProductSort {
  return SORT_OPTIONS.some((option) => option === value);
}

interface ProductResultsErrorProps {
  error: unknown;
  isFetching: boolean;
  onRetry: () => void;
  onResetFilters: () => void;
}

// AI 생성: 서버 상태 코드로 두 갈래를 가른다. 4xx는 재요청해도 같은 실패가 반복되므로
// 재시도 버튼 대신 필터를 기본값으로 되돌리는 복구 행동을 준다. 5xx·네트워크 예외는
// 일시 장애로 보고 재시도 버튼을 준다.
function ProductResultsError({ error, isFetching, onRetry, onResetFilters }: ProductResultsErrorProps) {
  const isClientError = error instanceof ApiError && error.status < 500;
  const message = error instanceof ApiError ? error.message : '상품 목록을 불러오지 못했습니다.';

  if (isClientError) {
    return (
      <div>
        <p>{message}</p>
        <button type="button" onClick={onResetFilters}>
          필터 초기화
        </button>
      </div>
    );
  }

  return (
    <div>
      <p>{message}</p>
      <button type="button" disabled={isFetching} onClick={onRetry}>
        다시 시도
      </button>
    </div>
  );
}

function ProductResults({ products, page, totalPages, isStale, onPageChange }: ProductResultsProps) {
  if (products.length === 0) {
    // AI 생성: 빈 결과 안내 문구. 로딩/에러 화면과 구분되도록 별도 문구를 쓴다.
    return (
      <div>
        <p>검색 결과가 없습니다.</p>
        <p>다른 검색어나 카테고리를 선택해 보세요.</p>
      </div>
    );
  }

  return (
    <>
      {/* AI 생성: 갱신 중이거나 갱신에 실패했을 때 목록을 흐리게 해 최신 결과가 아님을 알린다.
          opacity는 레이아웃에 영향을 주지 않는 속성이라 이 표시가 CLS를 만들지 않는다. */}
      <div className={isStale ? 'product-grid is-stale' : 'product-grid'}>
        {products.map((product) => (
          <ProductCardWithActions key={product.id} product={product} headingLevel="h2" />
        ))}
      </div>
      <nav className="pagination" aria-label="페이지 이동">
        <button type="button" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          이전
        </button>
        <span>
          {page} / {totalPages}
        </span>
        <button type="button" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
          다음
        </button>
      </nav>
    </>
  );
}

export default function ProductListSection() {
  const { filters, setQuery, setCategory, setSort, setPage, correctPage, resetFilters } = useProductListFilters();
  const queryClient = useQueryClient();

  // AI 생성: ESLint id-denylist 규칙이 식별자 data를 금지해서 productList로 이름을 바꿔 구조분해한다.
  // isPending: 이 필터 조합의 캐시가 아직 한 번도 없음(첫 로딩). isPlaceholderData: keepPreviousData로
  // 이전 필터의 결과를 보여주는 중(전환 중) — 에러는 Suspense 밖 useQuery라 여기서 값으로 받는다.
  const { data: productList, isPending, isPlaceholderData, isError, error, isFetching, refetch } = useQuery(productQueries.list(filters));

  // 페이지 초과 보정: 외부 시스템(브라우저 히스토리 = URL)에 쓰는 동기화이므로 useEffect가 맞다.
  // 파생값을 state로 복사하는 용도가 아니어서 프로젝트의 effect 금지 규칙에 해당하지 않는다.
  // AI 생성: isPlaceholderData 중엔 productList가 "이전 필터"의 응답이라 그 totalCount로 최신 filters.page를
  // 판단하면 안 된다(아직 도착하지 않은 페이지를 옛 응답 기준으로 잘못 교정). 에러·첫 로딩(productList 없음)도 건너뛴다.
  // AI 생성: 갱신 실패로 이전 조건의 목록을 유지하는 중에도 그 응답의 totalCount로 현재 page를
  // 교정하면 안 된다(화면에 남은 값은 지금 URL 조건의 결과가 아니다). isError도 함께 건너뛴다.
  useEffect(() => {
    if (!productList || isPlaceholderData || isError) return;
    const corrected = resolvePageOverflow(filters.page, productList.totalCount, productList.pageSize);
    if (corrected !== null) correctPage(corrected);
  }, [filters.page, productList, isPlaceholderData, isError, correctPage]);

  function handleCategoryChange(value: string) {
    if (isCategoryOption(value)) {
      trackCategoryFilterChange(value);
      setCategory(value);
    }
  }

  function handleSortChange(value: string) {
    if (isSortOption(value)) {
      trackSortChange(value);
      setSort(value);
    }
  }

  function handlePageChange(value: number) {
    trackPageChange(value);
    setPage(value);
  }

  // product_list_view는 마운트 1회만 보낸다. 시드 로그도 필터·정렬·페이지 변경 뒤 재발화가
  // 없다(0/4,090건). deps에 filters를 두면 exhaustive-deps 경고 없이 ref로 1회를 보장한다.
  const hasTrackedListView = useRef(false);
  useEffect(() => {
    if (hasTrackedListView.current) return;
    hasTrackedListView.current = true;
    trackProductListView({ category: filters.category, sort: filters.sort, page: filters.page });
  }, [filters]);

  // AI 생성: 필터를 바꾼 갱신이 실패하면 새 query key에는 데이터가 없어(keepPreviousData는 pending
  // 동안에만 이전 결과를 준다) 사용자가 보던 목록이 통째로 사라졌다. 이때만 직전 성공 결과를 query
  // cache에서 찾아 화면에 남긴다. 지금 URL 조건의 결과가 아니라는 사실은 상태줄 문구로 밝힌다.
  // ponytail: 렌더 중 캐시를 한 번 읽는 방식이라 캐시 변화에 반응하지 않는다. 이 값을 쓰는 시점은
  // 에러 렌더 직후뿐이라 충분하고, 실시간 반영이 필요해지면 useQuery를 하나 더 두는 쪽으로 올린다.
  const staleList = isError && !productList ? findLastSuccessfulProductList(queryClient) : null;
  const shownList = productList ?? staleList;
  const isShowingPreviousCondition = !productList && staleList !== null;

  const totalPages = shownList ? Math.ceil(shownList.totalCount / shownList.pageSize) : 0;
  // AI 생성: isPending은 "이 필터 조합의 데이터가 아직 없다"(최초 진입), isFetching은 "요청이 진행 중"이다.
  // 최초 진입은 아래에서 스켈레톤이 따로 담당하므로 여기서는 이미 목록이 있는 상태의 갱신만 가린다.
  const isUpdating = isFetching && !isPending;
  const statusNote = isUpdating ? ' · 갱신 중' : isError ? ' · 갱신 실패' : '';

  return (
    <main className="page-container">
      <section className="content-section">
        <h1>상품 목록</h1>
        <div className="product-filters">
          <SearchInput key={filters.q} defaultValue={filters.q} onSubmit={setQuery} />
          <label>
            카테고리
            {/* AI 생성: 결과 쿼리 실패·첫 로딩 시 productList.categories가 없다. 필터 영역은 항상 렌더해야
            하므로(에러여도 사용자가 갇히지 않게) 이때는 '전체' 하나만 두고 select를 비활성화한다. */}
            <select name="category" value={filters.category} disabled={!shownList} onChange={(event) => handleCategoryChange(event.target.value)}>
              {/* AI 생성: client-state-design.md 12번 — 'all'은 서버 categories에 없는 필터 개념이라 client가 붙이는 합성 옵션. 나머지 라벨은 서버 응답(shownList.categories)에서 그린다. */}
              <option value="all">전체</option>
              {shownList?.categories.map((category) => (
                <option value={category.id} key={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            정렬
            <select name="sort" value={filters.sort} onChange={(event) => handleSortChange(event.target.value)}>
              {SORT_OPTIONS.map((option) => (
                <option value={option} key={option}>
                  {SORT_LABELS[option]}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>
      <section className="content-section" aria-label="상품 검색 결과" aria-busy={isFetching}>
        {/* AI 생성: isError를 먼저 보지 않고 productList 유무를 먼저 본다. react-query는 갱신에 실패해도
            마지막 성공 데이터를 지우지 않으므로, 목록이 남아 있으면 유지한 채 실패를 알리고, 목록이
            없는 실패(최초 실패)만 전체 에러 화면으로 대체한다. */}
        {isPending ? (
          <ProductGridSkeleton count={PRODUCT_PAGE_SIZE} />
        ) : !shownList ? (
          <ProductResultsError error={error} isFetching={isFetching} onRetry={() => void refetch()} onResetFilters={resetFilters} />
        ) : (
          <>
            <p className="product-list-status">
              {/* AI 생성: 이전 조건의 결과를 남겨둔 상태에서는 개수만 보여주면 지금 URL 조건의 결과처럼
                  읽힌다. 무엇을 보고 있는지 문구로 분명히 밝혀 화면이 URL에 대해 거짓말하지 않게 한다. */}
              <span>{isShowingPreviousCondition ? `갱신 실패 — 아래는 이전 조건의 결과입니다 · 총 ${shownList.totalCount}개` : `총 ${shownList.totalCount}개${statusNote}`}</span>
              {isError && (
                <button type="button" disabled={isFetching} onClick={() => void refetch()}>
                  다시 시도
                </button>
              )}
            </p>
            <ProductResults products={shownList.products} page={filters.page} totalPages={totalPages} isStale={isUpdating || isError} onPageChange={handlePageChange} />
          </>
        )}
      </section>
    </main>
  );
}
