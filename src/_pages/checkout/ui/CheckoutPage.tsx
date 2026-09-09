'use client';

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import Image from 'next/image';
import { useCheckoutSubmit } from '@/features/checkout-submit/model/useCheckoutSubmit';
import { useCartStore } from '@/entities/cart/model/cartStore';
import { sessionQueries } from '@/entities/session/api/sessionQueries';
import { track } from '@/analytics/logger';

export function CheckoutPage() {
  const { items, submit, isPending, errorMessage } = useCheckoutSubmit();
  const itemDetails = useCartStore((state) => state.itemDetails);
  const { data: user } = useQuery(sessionQueries.me());

  // 주문서 화면 진입 시점 1회만 기록한다.
  // /orders/new는 보호 경로라 이 시점엔 항상 로그인 상태이므로 user는 사실상 항상 존재한다.
  useEffect(() => {
    track('order_start', { productIds: items, userId: user?.id });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (items.length === 0) {
    return (
      <section className="week05-section week09-order-page">
        <h1>주문서</h1>
        <p>장바구니가 비어 있습니다.</p>
      </section>
    );
  }

  const totalPrice = items.reduce(
    (sum, productId) => sum + (itemDetails[productId]?.price ?? 0),
    0,
  );

  return (
    <section className="week05-section week09-order-page">
      <h1>주문서</h1>
      {/* 이 페이지에서만 쓰는 레이아웃이라 전역 CSS 대신 인라인 스타일로 처리.
          상품 카드 목록 + 수량/총액을 하나의 바깥 테두리로 묶는다(카드 각각의
          테두리는 week09-order-item에 그대로 있고, 이건 그걸 감싸는 테두리). */}
      <div
        style={{
          display: 'grid',
          gap: 16,
          border: '1px solid #c8c8c8',
          padding: 16,
        }}
      >
        <ul className="week09-order-list">
          {items.map((productId) => {
            const details = itemDetails[productId];
            return (
              <li key={productId} className="week09-order-item">
                {details ? (
                  <>
                    <Image
                      src={details.image}
                      alt={details.name}
                      width={96}
                      height={96}
                    />
                    <div className="week09-order-item-info">
                      <p>{details.brand}</p>
                      <h3>{details.name}</h3>
                      <strong>{details.price.toLocaleString()}원</strong>
                    </div>
                  </>
                ) : (
                  // 이 변경 이전에 담긴 상품 등, 상세정보가 없는 경우의 방어적 표시
                  <div className="week09-order-item-info">
                    <p>{productId} × 1 (상품 정보 없음)</p>
                  </div>
                )}
              </li>
            );
          })}
        </ul>

        <div style={{ textAlign: 'right' }}>
          <p>총 수량: {items.length}개</p>
          <p>
            <strong>총 주문 금액: {totalPrice.toLocaleString()}원</strong>
          </p>
        </div>
      </div>

      <div className="week09-checkout-summary">
        {errorMessage && (
          <p className="week05-error" role="alert">
            {errorMessage}
          </p>
        )}

        <button type="button" onClick={() => submit()} disabled={isPending}>
          {isPending ? '주문 처리 중...' : '주문하기'}
        </button>
      </div>
    </section>
  );
}
