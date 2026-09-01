'use client';

import { useCartStore } from '@/entities/cart';

export function OrderPage() {
  const cart = useCartStore((state) => state.cart);

  return (
    <section className="week05-section">
      <h1>주문하기</h1>
      {cart.length === 0 ? (
        <p>장바구니가 비어 있습니다.</p>
      ) : (
        <>
          <ul>
            {cart.map((productId) => (
              <li key={productId}>상품 {productId}</li>
            ))}
          </ul>
          <p>총 {cart.length}종</p>
        </>
      )}
    </section>
  );
}
