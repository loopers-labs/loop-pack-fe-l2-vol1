'use client';

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useCheckoutSubmit } from '@/features/checkout-submit/model/useCheckoutSubmit';
import { sessionQueries } from '@/entities/session/api/sessionQueries';
import { track } from '@/analytics/logger';

export function CheckoutPage() {
  const { items, submit, isPending, errorMessage } = useCheckoutSubmit();
  const { data: user } = useQuery(sessionQueries.me());

  // 주문서 화면 진입 시점 1회만 기록한다. 금액(totalPrice)은 상품을 id로
  // 조회하는 API가 없고 화면에도 표시하지 않아 넣지 않는다 — RFC 문서에 근거 기록.
  // /orders/new는 보호 경로라 이 시점엔 항상 로그인 상태이므로 user는 사실상 항상 존재한다.
  useEffect(() => {
    track('order_start', { productIds: items, userId: user?.id });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (items.length === 0) {
    return (
      <section className="week05-section">
        <h1>주문서</h1>
        <p>장바구니가 비어 있습니다.</p>
      </section>
    );
  }

  return (
    <section className="week05-section">
      <h1>주문서</h1>
      <ul>
        {items.map((productId) => (
          <li key={productId}>{productId} × 1</li>
        ))}
      </ul>

      {errorMessage && (
        <p className="week05-error" role="alert">
          {errorMessage}
        </p>
      )}

      <button type="button" onClick={() => submit()} disabled={isPending}>
        {isPending ? '주문 처리 중...' : '주문하기'}
      </button>
    </section>
  );
}
