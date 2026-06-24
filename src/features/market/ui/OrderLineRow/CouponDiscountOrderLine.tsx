import { OrderLine } from '@/entities/market'

import type { CouponDiscountOrderLineProps } from './types'

export function CouponDiscountOrderLine({
  coupon,
  amount,
}: CouponDiscountOrderLineProps) {
  return (
    <OrderLine.Root>
      <OrderLine.Content>
        <OrderLine.Title>쿠폰 할인</OrderLine.Title>
        <OrderLine.Description>{coupon.code}</OrderLine.Description>
      </OrderLine.Content>
      <OrderLine.DiscountAmount amount={amount} />
    </OrderLine.Root>
  )
}
