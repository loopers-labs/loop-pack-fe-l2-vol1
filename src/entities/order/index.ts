// order 슬라이스의 Public API. 주문 도메인 타입과 조회·생성 계약을 공개한다.
// fetch 구현(api.ts)은 외부 소비처가 없으므로 숨긴다.
export type { Order, OrderItem } from '@/entities/order/model/order'
export { useOrderListQuery, useCreateOrderMutation } from '@/entities/order/api/service'
