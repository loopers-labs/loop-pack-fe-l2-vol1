'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { ordersQuery } from '../api/orders'
import { errorMessageOf } from '@/shared/api/http'

const FALLBACK_MESSAGE = '주문 내역을 불러오지 못했습니다.'

// 401 은 여기서 다루지 않는다. 조회의 401 은 세션 만료로 보고 QueryCache 한 곳에서
// 처리한다(app/providers.tsx). 이 화면이 따로 안내하면 같은 상황에 두 벌의 문구가 생긴다.
export default function OrderHistory() {
  const { data, error, isPending } = useQuery(ordersQuery())

  return (
    <main className="week09-orders">
      <h1>주문 내역</h1>

      {isPending ? <p role="status">불러오는 중…</p> : null}

      {error ? (
        <p className="week09-auth-error" role="alert">
          {errorMessageOf(error, FALLBACK_MESSAGE)}
        </p>
      ) : null}

      {data && data.orders.length === 0 ? (
        <p>
          아직 주문이 없습니다. <Link href="/products">상품을 둘러보세요</Link>.
        </p>
      ) : null}

      {data && data.orders.length > 0 ? (
        <ul className="week09-order-list">
          {data.orders.map((order) => (
            <li key={order.id}>
              <strong>주문 번호 {order.id}</strong>
              <span>{new Date(order.createdAt).toLocaleString('ko-KR')}</span>
              <span>
                {order.items
                  .map((item) => `${item.productId} × ${item.quantity}`)
                  .join(', ')}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </main>
  )
}
