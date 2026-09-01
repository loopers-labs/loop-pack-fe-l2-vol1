'use client';

import { useCartStore } from '@/entities/cart';
import Link from 'next/link';

import { useOrder } from '../model/useOrder';

/**
 * 주문서.
 *
 * 담아둔 상품을 그대로 주문한다. 장바구니가 상품 집합만 갖고 수량을 갖지 않으므로
 * 수량은 전부 1 로 보낸다 — 수량 조절 UI 를 만들지 않기로 한 결정의 결과다.
 *
 * 제출·비우기·계측은 useOrder 가 갖는다. 주문이 성공하면 장바구니를 비우는데, 로그아웃과
 * 다른 판단이다 — 로그아웃은 "이 기기에 담아둔 것"을 그대로 두는 게 맞고 주문 완료는
 * 담아둘 이유 자체가 사라진 시점이다.
 *
 * 비운 뒤에는 cart.length 가 0 이라 "장바구니가 비어 있습니다" 로 떨어질 수 있어
 * 완료 화면을 가장 먼저 분기한다.
 */
export function OrderPage() {
  const cart = useCartStore((state) => state.cart);
  const order = useOrder();

  if (order.isSuccess) {
    return (
      <section className="week05-section">
        <h1>주문 완료</h1>
        <p role="status">주문이 완료되었습니다. 주문번호 {order.data.order.id}</p>
        <Link href="/orders">주문 내역 보기</Link>
      </section>
    );
  }

  if (cart.length === 0) {
    return (
      <section className="week05-section">
        <h1>주문하기</h1>
        <p>장바구니가 비어 있습니다.</p>
      </section>
    );
  }

  return (
    <section className="week05-section">
      <h1>주문하기</h1>

      <ul>
        {cart.map((productId) => (
          <li key={productId}>상품 {productId}</li>
        ))}
      </ul>
      <p>총 {cart.length}종</p>

      {order.isError && <p role="alert">{order.error.message}</p>}

      <button type="button" onClick={() => order.mutate()} disabled={order.isPending}>
        {order.isPending ? '주문 중…' : '주문하기'}
      </button>
    </section>
  );
}
