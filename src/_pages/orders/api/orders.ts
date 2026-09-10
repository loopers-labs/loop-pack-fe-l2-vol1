import { queryOptions } from '@tanstack/react-query'
import { fetchJson, postJson } from '@/shared/api/http'

// 주문 조회·생성 계약이다. 주문 응답에는 금액이 없고 상품 id 와 수량만 있다
// (스타터 계약). 이름과 금액을 붙이려면 상품 조회 계약이 필요한데, 그것은
// `_pages/product-list` 슬라이스가 소유한다. 같은 레이어의 다른 슬라이스를 직접
// 참조할 수 없으므로, 붙이려면 계약을 entities/product 로 내리는 별도 결정이 필요하다.
// 이번 주 범위가 아니라 주문 화면은 id 와 수량만 보여준다.

export interface OrderItem {
  productId: string
  quantity: number
}

export interface Order {
  id: string
  createdAt: string
  items: OrderItem[]
}

export const ORDERS_QUERY_KEY = ['orders'] as const

export const ordersQuery = () =>
  queryOptions({
    queryKey: ORDERS_QUERY_KEY,
    queryFn: ({ signal }) =>
      fetchJson<{ orders: Order[] }>('/api/orders', signal),
    // 주문 내역은 사용자가 방금 만든 결과를 보러 오는 화면이다. 캐시가 오래 살아 있으면
    // 주문 직후 목록에 자기 주문이 없는 화면을 본다.
    staleTime: 0,
  })

export const createOrder = (items: OrderItem[]) =>
  postJson<{ order: Order }>('/api/orders', { items })
