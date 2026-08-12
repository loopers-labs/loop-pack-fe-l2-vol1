'use client';

import { Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ProductGrid } from '@/entities/product';
import { AddToCartButton } from '@/features/add-to-cart/ui/AddToCartButton';
import { WishButton } from '@/features/toggle-wishlist/ui/WishButton';
import type { ProductListQuery } from '@/types/commerce';
import { productQueries } from '../api/products.queries';
import { useProductFilters } from '../model/useProductFilters';
import { SearchForm } from './SearchForm';
import { ProductsSkeleton } from './ProductsSkeleton';

const CATEGORY_OPTIONS = [
  { value: 'all', label: '전체' },
  { value: 'casual', label: '캐주얼' },
  { value: 'fashion', label: '패션' },
  { value: 'goods', label: '뷰티·잡화' },
  { value: 'home', label: '홈' },
  { value: 'digital', label: '디지털' },
] as const;

// 성공 + 0건 화면용 — 현재 URL 조건을 문구로 명시한다.
function describeFilters(filters: ProductListQuery): string {
  const parts: string[] = [];
  if (filters.q) parts.push(`검색 "${filters.q}"`);
  const category = CATEGORY_OPTIONS.find((c) => c.value === filters.category);
  if (category && category.value !== 'all')
    parts.push(`카테고리 ${category.label}`);
  return parts.length > 0 ? parts.join(' · ') : '전체 목록';
}

/*
 * 목록의 여섯 상태 (2단계 상태 표):
 * ① 데이터 없는 최초 진입  — isPending → 그리드 스켈레톤 (목록 크기 예상 가능)
 * ② 이전 데이터가 있는 갱신 — keepPreviousData로 기존 목록 유지 + isFetching "갱신 중…"
 * ③ 성공 + 0건            — 현재 URL 조건을 명시한 0건 문구
 * ④ 최초 실패             — 보여줄 데이터 없음(data === undefined) → 실패 이유 + 다시 시도
 * ⑤ 갱신 실패(같은 키)     — data 유지 + isError → 기존 목록 위에 실패 배너 + 다시 시도
 *    (조건 변경 후 실패는 ④로 처리한다 — 이전 조건의 목록을 유지하면 URL과 화면이 어긋난다)
 * ⑥ 취소                  — 키 변경 시 이전 요청은 자기 키의 캐시로만 저장되고 화면은
 *    active key만 렌더하므로 늦게 끝나도 현재 화면을 덮지 않는다 (관찰로 확인, 개입 없음)
 *
 * isPending = 캐시에 보여줄 데이터가 없는 최초 로딩(스켈레톤 담당),
 * isFetching = 요청 진행 중 전부(갱신 표시 담당). isPending ⊂ isFetching.
 */
function ProductsResult({
  filters,
  onPageChange,
}: {
  filters: ProductListQuery;
  onPageChange: (page: number) => void;
}) {
  const { data, isPending, isError, isFetching, refetch } = useQuery(
    productQueries.list(filters),
  );

  if (isPending) return <ProductsSkeleton />;

  if (data === undefined)
    return (
      <div role="alert">
        <p>상품을 불러오지 못했어요.</p>
        <button type="button" onClick={() => void refetch()}>
          다시 시도
        </button>
      </div>
    );

  const totalPages = Math.max(1, Math.ceil(data.totalCount / data.pageSize));

  return (
    <>
      <p>
        총 {data.totalCount}개
        {isFetching ? <span aria-live="polite"> · 갱신 중…</span> : null}
      </p>
      {isError ? (
        <div role="alert">
          <p>갱신에 실패했어요. 아래는 마지막으로 성공한 결과예요.</p>
          <button type="button" onClick={() => void refetch()}>
            다시 시도
          </button>
        </div>
      ) : null}
      {data.products.length === 0 ? (
        <p>{describeFilters(filters)} 조건에 맞는 상품이 없어요. (0개)</p>
      ) : (
        <ProductGrid
          products={data.products}
          renderActions={(product) => (
            <>
              <WishButton productId={product.id} productName={product.name} />
              <AddToCartButton
                productId={product.id}
                productName={product.name}
              />
            </>
          )}
        />
      )}
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

// useProductFilters(내부 useSearchParams)는 정적 프리렌더 시 Suspense 경계가 필요하다.
export function ProductsPage() {
  return (
    <Suspense fallback={<ProductsSkeleton />}>
      <ProductsPageContent />
    </Suspense>
  );
}

function ProductsPageContent() {
  const { filters, setSearch, setCategory, setSort, setPage } =
    useProductFilters();

  return (
    <main>
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
              {CATEGORY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
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
