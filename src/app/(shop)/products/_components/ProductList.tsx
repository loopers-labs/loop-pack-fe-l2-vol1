'use client';

import type { ProductListQuery } from '@/types/commerce';
import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { productListQueryOptions } from '@/services/queries/products';

import { ProductCard } from '../../_components/ProductCard';
import { DEFAULT_PAGE_SIZE } from '../_constants';

/**
 * 상품 목록 "결과"만 담당한다. 필터 폼은 이 컴포넌트 밖(ProductListView)에 있다.
 *
 * keepPreviousData: 조건 변경 중에도 이전 목록을 유지해 깜빡임 없이 갱신한다.
 * (useSuspenseQuery는 placeholderData를 못 쓰므로 여기서는 useQuery를 쓴다.)
 * throwOnError: 에러는 상위 ErrorBoundary(ProductListView)로 던진다.
 */
type ProductListProps = {
  query: ProductListQuery;
  page: number;
  onPageChange: (page: number) => void;
};

export function ProductList({ query, page, onPageChange }: ProductListProps) {
  const { data, isPlaceholderData } = useQuery({
    ...productListQueryOptions.list(query),
    placeholderData: keepPreviousData,
    throwOnError: true,
  });

  if (!data) {
    return (
      <section className="week05-section" aria-label="상품 검색 결과" aria-busy>
        <p>상품을 불러오는 중입니다…</p>
      </section>
    );
  }

  const totalPages = Math.max(1, Math.ceil(data.totalCount / DEFAULT_PAGE_SIZE));

  return (
    <section className="week05-section" aria-label="상품 검색 결과" aria-busy={isPlaceholderData}>
      {data.products.length === 0 ? (
        <p>조건에 맞는 상품이 없습니다.</p>
      ) : (
        <>
          <p>총 {data.totalCount}개</p>
          <div className="week05-grid">
            {data.products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          <nav className="week05-pagination" aria-label="페이지 이동">
            <button type="button" onClick={() => onPageChange(page - 1)} disabled={page <= 1 || isPlaceholderData}>
              이전
            </button>
            <span>
              {page} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages || isPlaceholderData}
            >
              다음
            </button>
          </nav>
        </>
      )}
    </section>
  );
}
