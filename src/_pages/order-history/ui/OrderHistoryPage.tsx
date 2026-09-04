'use client';

import Link from 'next/link';
import { Suspense } from 'react';
import { ErrorBoundary, type FallbackProps } from 'react-error-boundary';
import { useQueryErrorResetBoundary } from '@tanstack/react-query';
import { ApiError } from '@/shared/api/apiFetch';
import { SessionExpiredError } from '@/shared/api/SessionExpiredError';
import OrderHistorySection from './OrderHistorySection';

// 실제 카드 높이는 항목 수에 따라 달라 완전히 맞출 수 없다. 항목 1개짜리 카드 1장으로 골격만 같게 둔다.
function OrderHistorySkeleton() {
  return (
    <div className="order-card order-card-skeleton" aria-hidden="true">
      <p className="order-card-head">주문 내역을 불러오는 중</p>
      <div className="order-line">
        <span className="order-line-image" />
        <div className="order-line-body">
          <p className="order-line-name">상품명</p>
          <p className="order-line-meta">가격 · 수량</p>
        </div>
        <strong className="order-line-subtotal">금액</strong>
      </div>
    </div>
  );
}

function OrderHistoryError({ error, resetErrorBoundary }: FallbackProps) {
  // 세션 만료는 전역 처리(providers.tsx의 QueryCache onError)가 이미 로그인 화면으로 이동시킨다.
  // 이 분기는 그 이동이 아직 끝나지 않은 짧은 순간에 재시도 버튼이 잠깐 보이는 것만 막는다.
  if (error instanceof SessionExpiredError) {
    return (
      <div className="empty-state">
        <p role="alert">로그인이 필요합니다.</p>
        <Link className="empty-state-action" href="/login?next=/orders">
          로그인하러 가기
        </Link>
      </div>
    );
  }

  return (
    <div className="empty-state">
      <p role="alert">{error instanceof ApiError ? error.message : '주문 내역을 불러오지 못했습니다.'}</p>
      <button type="button" onClick={resetErrorBoundary}>
        다시 시도
      </button>
    </div>
  );
}

export default function OrderHistoryPage() {
  const { reset } = useQueryErrorResetBoundary();

  return (
    <main className="page-container">
      <h1>주문 내역</h1>
      <section className="content-section" aria-label="주문 목록">
        <ErrorBoundary onReset={reset} FallbackComponent={OrderHistoryError}>
          <Suspense fallback={<OrderHistorySkeleton />}>
            <OrderHistorySection />
          </Suspense>
        </ErrorBoundary>
      </section>
    </main>
  );
}
