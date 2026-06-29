// Generated with Claude Code
import { OrderLineRow } from './OrderLineRow'
import type { CartItem } from './types'

// 타입별 줄 = 도메인 의미를 담는 얇은 합성 컴포넌트.
// 새 줄 타입(부분취소, 선물포장...)이 생기면 여기에 컴포넌트만 추가한다.

export function ProductLine({ item }: { item: CartItem }) {
  return (
    <OrderLineRow
      label={item.name}
      amount={item.price * item.quantity}
      thumbnail={item.thumbnail}
      meta={item.option ? `${item.option} · 수량 ${item.quantity}` : undefined}
    />
  )
}

export function SubtotalLine({ amount }: { amount: number }) {
  return <OrderLineRow label="상품 금액" amount={amount} />
}

export function ShippingLine({ amount }: { amount: number }) {
  return <OrderLineRow label="배송비" amount={amount} />
}

export function CouponLine({ amount, code }: { amount: number; code: string }) {
  return <OrderLineRow label="쿠폰 할인" amount={amount} meta={code} isDiscount />
}

export function PointLine({ amount }: { amount: number }) {
  return <OrderLineRow label="적립금 사용" amount={amount} isDiscount />
}
