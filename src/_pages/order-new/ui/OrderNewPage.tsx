'use client';

import Link from 'next/link';

import { useRestoreCheckoutDraft } from '@/entities/order';
import { OrderForm, useOrderDraft } from '@/features/order';

export function OrderNewPage() {
  // draft는 주문서만 소비하므로 sessionStorage 복원도 여기서 시작한다
  useRestoreCheckoutDraft();

  return (
    <section className="week05-section" aria-labelledby="order-new-title">
      <h1 id="order-new-title">주문서</h1>
      <OrderNewContent />
    </section>
  );
}

function OrderNewContent() {
  const orderDraft = useOrderDraft();

  if (orderDraft.status === 'restoring' || orderDraft.status === 'loading') {
    return <p>주문서를 불러오는 중</p>;
  }

  if (orderDraft.status === 'error') {
    return (
      <p role="alert">
        상품 정보를 불러오지 못했습니다.
        <button type="button" onClick={orderDraft.retryCatalog}>
          다시 시도
        </button>
      </p>
    );
  }

  if (orderDraft.status === 'empty') {
    return (
      <>
        <p>주문할 상품이 없습니다</p>
        <Link href="/cart">장바구니로 이동</Link>
      </>
    );
  }

  return (
    <>
      <OrderForm
        orderProducts={orderDraft.orderProducts}
        totalPrice={orderDraft.totalPrice}
      />
      {/* 주문서는 읽기 전용이라 수량 수정은 장바구니로 돌아가서 한다 */}
      <Link href="/cart">장바구니로 돌아가기</Link>
    </>
  );
}
