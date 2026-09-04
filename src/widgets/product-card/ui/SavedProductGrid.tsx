'use client';

import { Suspense } from 'react';
import { ErrorBoundary, type FallbackProps } from 'react-error-boundary';
import { useQueryErrorResetBoundary, useSuspenseQuery } from '@tanstack/react-query';
import { productCatalogQueries } from '@/entities/product';
import ProductCardWithActions from './ProductCardWithActions';

interface SavedProductGridProps {
  productIds: Set<string>;
}

// 장바구니·위시리스트는 상품 id만 갖는 클라이언트 상태다(Zustand Set). 이름·가격·이미지는
// GET /api/products 응답에서 붙인다 — 주문 화면들이 쓰는 카탈로그 캐시를 그대로 재사용한다.
function SavedProducts({ productIds }: SavedProductGridProps) {
  const { data: catalog } = useSuspenseQuery(productCatalogQueries.lookup());

  return (
    <div className="product-grid">
      {[...productIds].map((productId) => {
        const product = catalog[productId];

        // 담긴 id는 상품 목록에서 온 값이라 카탈로그에 없을 수 없다. 그래도 카탈로그 요청이
        // 일부 실패했을 때 카드 대신 빈 칸이 생기지 않도록 id라도 보여준다.
        if (!product) {
          return <p key={productId}>{productId} — 상품 정보 없음</p>;
        }

        return <ProductCardWithActions key={productId} product={product} headingLevel="h2" />;
      })}
    </div>
  );
}

function CatalogError({ resetErrorBoundary }: FallbackProps) {
  return (
    <div className="empty-state">
      <p role="alert">상품 정보를 불러오지 못했습니다.</p>
      <button type="button" onClick={resetErrorBoundary}>
        다시 시도
      </button>
    </div>
  );
}

// 비어 있는 경우는 호출부가 먼저 거른다 — 담긴 것이 없으면 카탈로그를 받을 이유가 없고,
// 서버 렌더에서는 Set이 항상 비어 있어 이 경계가 아예 만들어지지 않는다.
export default function SavedProductGrid({ productIds }: SavedProductGridProps) {
  const { reset } = useQueryErrorResetBoundary();

  return (
    <ErrorBoundary onReset={reset} FallbackComponent={CatalogError}>
      <Suspense fallback={<p>상품 정보를 불러오는 중</p>}>
        <SavedProducts productIds={productIds} />
      </Suspense>
    </ErrorBoundary>
  );
}
