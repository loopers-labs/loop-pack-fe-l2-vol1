'use client';

import { ProductCard } from '@/entities/product';
import { AddToCartButton } from '@/features/add-to-cart';
import { DEFAULT_PAGE_SIZE } from '@/features/product-filter';
import { WishlistToggleButton } from '@/features/toggle-wishlist';
import { shouldEscalateToBoundary } from '@/shared/api/httpError';
import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { productListQueryOptions } from '../api/productListQueries';
import type { ProductListQuery } from '../model/types';

/**
 * 상품 목록 "결과"만 담당한다. 필터 폼은 이 컴포넌트 밖(features/product-filter)에 있다.
 *
 * keepPreviousData: 조건 변경 중에도 이전 목록을 유지해 깜빡임 없이 갱신한다.
 * (useSuspenseQuery는 placeholderData를 못 쓰므로 여기서는 useQuery를 쓴다.)
 *
 * throwOnError: 5xx·네트워크만 상위 ErrorBoundary(ProductListPage)로 던진다.
 * 4xx 는 사용자가 필터를 고쳐 빠져나올 수 있으므로 여기서 인라인으로 안내한다.
 * 경계로 던지면 고칠 수단인 필터 폼까지 언마운트된다.
 */
type ProductListProps = {
  query: ProductListQuery;
  page: number;
  onPageChange: (page: number) => void;
};

export function ProductListResult({ query, page, onPageChange }: ProductListProps) {
  const { data, error, isPlaceholderData } = useQuery({
    ...productListQueryOptions.list(query),
    placeholderData: keepPreviousData,
    throwOnError: (queryError) => shouldEscalateToBoundary(queryError),
  });

  // 여기 도달했다는 것은 경계로 올리지 않기로 한 에러(4xx)라는 뜻이다.
  // 5xx·네트워크는 throwOnError 가 이미 던져 이 줄에 오지 않는다.
  if (error !== null) {
    return (
      <section className="week05-section" aria-label="상품 검색 결과" role="alert">
        <p>{error.message}</p>
        <p>검색 조건을 바꾸면 다시 조회합니다.</p>
      </section>
    );
  }

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
              <ProductCard
                key={product.id}
                product={product}
                actions={
                  <>
                    <WishlistToggleButton productId={product.id} productName={product.name} />
                    <AddToCartButton productId={product.id} productName={product.name} />
                  </>
                }
              />
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
