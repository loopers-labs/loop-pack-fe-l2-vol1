'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { orderQueries } from '@/entities/order';

// 주문 내역. 401은 throwOnError로 (commerce) 경계가 받는다 (RFC D5) — 여기서는 성공·로딩·그 외 실패만 본다.
export function OrdersPage() {
  const { data, isPending, isError, refetch } = useQuery(orderQueries.list());

  return (
    <main>
      <section className="week05-section" aria-label="주문 내역">
        <h1>주문 내역</h1>
        {isPending ? (
          <p role="status">주문 내역을 불러오는 중…</p>
        ) : isError ? (
          <div role="alert">
            <p>주문 내역을 불러오지 못했어요.</p>
            <button type="button" onClick={() => void refetch()}>
              다시 시도
            </button>
          </div>
        ) : data.length === 0 ? (
          <p>
            아직 주문이 없어요. <Link href="/products">상품 보러 가기</Link>
          </p>
        ) : (
          <ul>
            {data.map((order) => (
              <li key={order.id}>
                주문 {order.id} · 상품 {order.items.length}개 ·{' '}
                <time dateTime={order.createdAt}>
                  {new Date(order.createdAt).toLocaleString('ko-KR')}
                </time>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
