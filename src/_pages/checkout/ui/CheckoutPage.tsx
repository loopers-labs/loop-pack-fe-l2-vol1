'use client';

import { useCheckoutSubmit } from '@/features/checkout-submit/model/useCheckoutSubmit';

export function CheckoutPage() {
  const { items, submit, isPending, errorMessage } = useCheckoutSubmit();

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
