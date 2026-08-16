'use client';

import { useState } from 'react';

import { ProductCard } from '@/entities/product';
import { AddToCartButton } from '@/features/add-to-cart';
import { DEFAULT_PAGE_SIZE } from '@/features/product-filter';
import { WishlistToggleButton } from '@/features/toggle-wishlist';
import { shouldEscalateToBoundary } from '@/shared/api/httpError';
import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { productListQueryOptions } from '../api/productListQueries';
import type { ProductListQuery, ProductListResponse } from '../model/types';
import styles from './ProductListResult.module.css';

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

/** 0건일 때 어떤 조건으로 조회했는지 문장으로 만든다. 조건이 없으면 빈 배열이다. */
function describeQuery(query: ProductListQuery, categories: ProductListResponse['categories']): string[] {
  const parts: string[] = [];

  if (query.q) parts.push(`검색어 "${query.q}"`);

  if (query.category && query.category !== 'all') {
    const name = categories.find((category) => category.id === query.category)?.name;
    parts.push(`카테고리 "${name ?? query.category}"`);
  }

  return parts;
}

function ProductListSkeleton() {
  return (
    <div className="week05-grid">
      {Array.from({ length: DEFAULT_PAGE_SIZE }, (_, index) => (
        <div key={index} className={styles.skeletonCard} aria-hidden="true">
          <span className={styles.skeletonImage} />
          <span className={styles.skeletonBrand} />
          <span className={styles.skeletonName} />
          <span className={styles.skeletonPrice} />
          <span className={styles.skeletonActions} />
        </div>
      ))}
    </div>
  );
}

export function ProductListResult({ query, page, onPageChange }: ProductListProps) {
  const current = useQuery({
    ...productListQueryOptions.list(query),
    placeholderData: keepPreviousData,
    throwOnError: (queryError) => shouldEscalateToBoundary(queryError),
  });

  /**
   * 마지막으로 성공한 조회 "조건"만 기억한다.
   *
   * keepPreviousData 는 pending 동안에만 이전 목록을 채운다. 조건을 바꾼 조회가
   * 최종 실패하면 data 가 undefined 가 되어 보고 있던 목록이 통째로 사라진다.
   *
   * 응답 자체를 붙들지는 않는다. 여기 담는 것은 URL 에서 파생된 조회 조건이고,
   * 목록 데이터는 아래 fallback 쿼리가 React Query 캐시에서 읽는다.
   * 서버 응답의 소유자는 계속 React Query 다.
   */
  const signature = JSON.stringify(query);
  const [lastSucceeded, setLastSucceeded] = useState({ signature, query });

  if (current.data && lastSucceeded.signature !== signature) {
    setLastSucceeded({ signature, query });
  }

  /** 캐시에 남아 있는 마지막 성공 결과. enabled: false 라 새로 요청하지 않는다. */
  const fallback = useQuery({ ...productListQueryOptions.list(lastSucceeded.query), enabled: false });

  const { error, isPlaceholderData, refetch } = current;
  const data = current.data ?? fallback.data;

  if (!data) {
    // 데이터 없는 최초 진입. 실제 목록 크기를 예상할 수 있게 카드 골격을 보여준다.
    if (error === null) {
      return (
        <section className="week05-section" aria-label="상품 검색 결과" aria-busy>
          <p className={styles.status} role="status">
            상품을 불러오는 중입니다…
          </p>
          <ProductListSkeleton />
        </section>
      );
    }

    // 최초 실패. 보여줄 목록이 없으므로 실패 이유와 다시 시도할 방법만 남긴다.
    // 여기 도달했다는 것은 경계로 올리지 않기로 한 에러(4xx)라는 뜻이다.
    return (
      <section className="week05-section" aria-label="상품 검색 결과" role="alert">
        <p>{error.message}</p>
        <p>검색 조건을 바꾸거나 다시 시도해 주세요.</p>
        <button type="button" onClick={() => refetch()}>
          다시 시도
        </button>
      </section>
    );
  }

  // 여기부터는 보여줄 목록이 있다. 갱신이 실패했어도 목록을 비우지 않는다.
  const updateFailed = error !== null;
  const updating = isPlaceholderData && !updateFailed;
  const totalPages = Math.max(1, Math.ceil(data.totalCount / DEFAULT_PAGE_SIZE));
  const conditions = describeQuery(query, data.categories);

  return (
    <section className="week05-section" aria-label="상품 검색 결과" aria-busy={updating}>
      {updateFailed && (
        <p role="alert">
          목록을 갱신하지 못했습니다. {error.message} 아래는 이전 결과입니다.
          <button type="button" className={styles.retryButton} onClick={() => refetch()}>
            다시 시도
          </button>
        </p>
      )}

      {data.products.length === 0 ? (
        <p>
          {conditions.length > 0
            ? `${conditions.join(', ')} 조건에 맞는 상품이 0개입니다.`
            : '등록된 상품이 0개입니다.'}
        </p>
      ) : (
        <>
          <p>총 {data.totalCount}개</p>
          <div className={`week05-grid ${updating || updateFailed ? styles.updating : ''}`}>
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
