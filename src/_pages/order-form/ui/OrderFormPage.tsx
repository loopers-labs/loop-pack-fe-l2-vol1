'use client';

import Link from 'next/link';
import { Suspense, useEffect, useRef, useState } from 'react';
import { ErrorBoundary, type FallbackProps } from 'react-error-boundary';
import { useQuery, useQueryErrorResetBoundary } from '@tanstack/react-query';
import { ApiError } from '@/shared/api/apiFetch';
import { useCartStore } from '@/entities/cart';
import { authQueries } from '@/entities/auth';
import { trackOrderStart } from '@/analytics/events';
import OrderFormSection from './OrderFormSection';

function OrderFormSkeleton() {
  return (
    <div className="order-line order-line-boxed order-card-skeleton" aria-hidden="true">
      <span className="order-line-image" />
      <div className="order-line-body">
        <p className="order-line-name">주문 상품을 불러오는 중</p>
        <p className="order-line-meta">가격</p>
      </div>
      <strong className="order-line-subtotal">금액</strong>
    </div>
  );
}

function OrderFormError({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <div className="empty-state">
      <p role="alert">{error instanceof ApiError ? error.message : '주문 상품 정보를 불러오지 못했습니다.'}</p>
      <button type="button" onClick={resetErrorBoundary}>
        다시 시도
      </button>
    </div>
  );
}

export default function OrderFormPage() {
  const { reset } = useQueryErrorResetBoundary();
  const cartCount = useCartStore((state) => state.items.size);
  // 진입 시점의 값으로 고정한다. 주문에 성공하면 장바구니가 비워지는데, 그때 아래 가드가 다시
  // 걸리면 주문 내역으로 이동하는 도중 "주문할 상품이 없습니다"가 잠깐 보인다.
  const [enteredWithItems] = useState(() => cartCount > 0);
  // order_start의 productIds도 같은 이유로 진입 시점에 고정한다 — 주문 성공 뒤 장바구니가
  // 비워져도 이미 보낸 이벤트 내용이 바뀌지 않는다.
  const [productIds] = useState(() => [...useCartStore.getState().items.keys()]);
  const { data: user } = useQuery(authQueries.me());

  // order_start — 보호 경로라 로그인 상태가 보장된다(userId 출처는 04번 2-c). early return
  // 앞에 둬야 하는 Hooks 규칙 때문에 효과 자체는 무조건 호출하고, 조건은 안에서 가드한다.
  const hasTrackedOrderStart = useRef(false);
  useEffect(() => {
    if (!enteredWithItems || !user || hasTrackedOrderStart.current) return;
    hasTrackedOrderStart.current = true;
    trackOrderStart({ productIds, userId: user.id });
  }, [enteredWithItems, user, productIds]);

  // 장바구니는 메모리에만 있어 전체 페이지 이동마다 비워진다(02-new-pages-design.md 6-1 확정).
  // 예외 처리가 아니라 자주 지나가는 정상 경로라, 여기서 먼저 걸러 상품 카탈로그도 받지 않는다.
  if (!enteredWithItems) {
    return (
      <main className="page-container">
        <h1>주문서</h1>
        <div className="empty-state">
          <p>주문할 상품이 없습니다.</p>
          <Link className="empty-state-action" href="/products">
            상품 보러 가기
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="page-container">
      <h1>주문서</h1>
      <ErrorBoundary onReset={reset} FallbackComponent={OrderFormError}>
        <Suspense fallback={<OrderFormSkeleton />}>
          <OrderFormSection />
        </Suspense>
      </ErrorBoundary>
    </main>
  );
}
