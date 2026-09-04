'use client';

import { hashKey, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { ProductListPending } from './ProductListPending';

import { trackEvent } from '@/analytics/events';
import {
  ProductCard,
  productQueries,
  type ProductListResponse,
} from '@/entities/product';
import { CartToggleButton } from '@/features/cart';
import {
  countTotalPages,
  toProductListQuery,
  usePageClamp,
  useProductListUrlState,
} from '@/features/product';
import { WishlistToggleButton } from '@/features/wishlist';

export function ProductList() {
  const { conditions, changePage } = useProductListUrlState();
  const queryClient = useQueryClient();

  // 진입 시점 조건으로 목록 진입당 한 번만 기록한다. 필터·정렬 변경은 계측 대상이 아니다.
  useEffect(() => {
    trackEvent('product_list_view', {
      category: conditions.category,
      sort: conditions.sort,
      page: conditions.page,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 마운트 1회, 진입 시점 값 사용이 의도
  }, []);
  const productListQuery = productQueries.list(toProductListQuery(conditions));
  const currentQueryHash = hashKey(productListQuery.queryKey);
  const [lastSuccessfulQueryKey, setLastSuccessfulQueryKey] = useState<
    typeof productListQuery.queryKey | null
  >(null);

  const { data, isError, error, isPlaceholderData, isFetching, refetch } =
    useQuery(productListQuery);

  if (
    data !== undefined &&
    !isPlaceholderData &&
    (!lastSuccessfulQueryKey ||
      hashKey(lastSuccessfulQueryKey) !== currentQueryHash)
  ) {
    setLastSuccessfulQueryKey(productListQuery.queryKey);
  }

  const lastSuccessfulData = lastSuccessfulQueryKey
    ? queryClient.getQueryData<ProductListResponse>(lastSuccessfulQueryKey)
    : undefined;
  const visibleData = data ?? lastSuccessfulData;
  const isShowingPreviousData =
    isPlaceholderData ||
    (data === undefined && lastSuccessfulData !== undefined);

  const totalPages = visibleData
    ? countTotalPages(visibleData.totalCount, visibleData.pageSize)
    : null;

  // 이전 목록을 보여주는 동안에는 현재 조건의 총 페이지 수를 아직 모른다.
  // 그 값으로 보정하면 캐시가 만료된 뒤 뒤로 왔을 때 엉뚱한 페이지로 밀어낸다.
  const confirmedTotalPages = isShowingPreviousData ? null : totalPages;

  const { isPageOutOfRange } = usePageClamp(confirmedTotalPages);

  // 보정으로 주소가 바뀌기 전에 '99999 / 3' 같은 화면이 잠깐 보이지 않게 막는다.
  if (isPageOutOfRange) {
    return (
      <p className="week05-status" role="status">
        올바른 페이지로 이동 중입니다.
      </p>
    );
  }

  if (!visibleData && isError) {
    return (
      <div className="week05-error" role="alert">
        <p>{error.message}</p>
        <div className="week05-error-actions">
          <button
            type="button"
            disabled={isFetching}
            onClick={() => void refetch()}
          >
            다시 시도
          </button>
          <Link href="/">홈으로 가기</Link>
        </div>
      </div>
    );
  }

  if (!visibleData) {
    return <ProductListPending />;
  }

  return (
    <>
      {isError && (
        <p className="week05-error-banner" role="alert">
          새 목록을 불러오지 못했습니다.
          <button
            type="button"
            disabled={isFetching}
            onClick={() => void refetch()}
          >
            다시 시도
          </button>
        </p>
      )}
      <p>총 {visibleData.totalCount}개</p>
      {visibleData.totalCount === 0 ? (
        <p className="week05-empty">조건에 맞는 상품이 없습니다.</p>
      ) : (
        <>
          <div className="week05-grid" data-updating={isShowingPreviousData}>
            {visibleData.products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                headingLevel="h2"
                actions={
                  <>
                    <WishlistToggleButton
                      productId={product.id}
                      productName={product.name}
                    />
                    <CartToggleButton
                      productId={product.id}
                      productName={product.name}
                    />
                  </>
                }
              />
            ))}
          </div>
          {/* 이전 목록을 보여주는 동안엔 URL이 아니라 응답의 page를 써 상품과 번호를 함께 바꾼다. */}
          <ProductListPagination
            page={visibleData.page}
            totalPages={totalPages ?? 1}
            isUpdating={isShowingPreviousData}
            onPageChange={changePage}
          />
        </>
      )}
    </>
  );
}

function ProductListPagination({
  page,
  totalPages,
  isUpdating,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  isUpdating: boolean;
  onPageChange: (page: number) => void;
}) {
  return (
    <nav className="week05-pagination" aria-label="페이지 이동">
      <button
        type="button"
        disabled={page <= 1 || isUpdating}
        onClick={() => {
          onPageChange(page - 1);
        }}
      >
        이전
      </button>
      <span>
        {page} / {totalPages}
      </span>
      <button
        type="button"
        disabled={page >= totalPages || isUpdating}
        onClick={() => {
          onPageChange(page + 1);
        }}
      >
        다음
      </button>
    </nav>
  );
}
