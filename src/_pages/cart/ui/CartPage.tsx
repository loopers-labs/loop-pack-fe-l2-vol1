'use client';

import Link from 'next/link';
import { Suspense } from 'react';
import { ErrorBoundary, type FallbackProps } from 'react-error-boundary';
import { useQueryErrorResetBoundary } from '@tanstack/react-query';
import { useCartStore } from '@/entities/cart';
import CartSection from './CartSection';

function CartSkeleton() {
  return (
    <div className="order-line order-line-boxed order-card-skeleton" aria-hidden="true">
      <span className="order-line-image" />
      <div className="order-line-body">
        <p className="order-line-name">담은 상품을 불러오는 중</p>
        <p className="order-line-meta">가격</p>
      </div>
      <strong className="order-line-subtotal">금액</strong>
    </div>
  );
}

function CartError({ resetErrorBoundary }: FallbackProps) {
  return (
    <div className="empty-state">
      <p role="alert">담은 상품 정보를 불러오지 못했습니다.</p>
      <button type="button" onClick={resetErrorBoundary}>
        다시 시도
      </button>
    </div>
  );
}

export default function CartPage() {
  const { reset } = useQueryErrorResetBoundary();
  const cartCount = useCartStore((state) => state.items.size);

  // 담긴 것이 없으면 상품 카탈로그를 받을 이유가 없다. 서버 렌더에서는 store가 항상 비어 있어
  // 이 분기 덕분에 카탈로그를 기다리는 경계가 아예 만들어지지 않는다.
  if (cartCount === 0) {
    return (
      <main className="page-container">
        <h1>장바구니</h1>
        <div className="empty-state">
          <p>담은 상품이 없습니다.</p>
          <Link className="empty-state-action" href="/products">
            상품 보러 가기
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="page-container">
      <h1>장바구니</h1>
      <ErrorBoundary onReset={reset} FallbackComponent={CartError}>
        <Suspense fallback={<CartSkeleton />}>
          <CartSection />
        </Suspense>
      </ErrorBoundary>
    </main>
  );
}
