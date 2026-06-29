import { OrderLine } from '@/entities/market'

import type { PointDiscountOrderLineProps } from './types'

export function PointDiscountOrderLine({
  amount,
}: PointDiscountOrderLineProps) {
  return (
    <OrderLine.Root>
      <OrderLine.Content>
        <OrderLine.Title>적립금 사용</OrderLine.Title>
      </OrderLine.Content>
      <OrderLine.DiscountAmount amount={amount} />
    </OrderLine.Root>
  )
}
