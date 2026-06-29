import { OrderLine } from '@/entities/market'

import type { MemberDiscountOrderLineProps } from './types'

export function MemberDiscountOrderLine({
  amount,
}: MemberDiscountOrderLineProps) {
  return (
    <OrderLine.Root>
      <OrderLine.Content>
        <OrderLine.Title>VIP 회원 할인</OrderLine.Title>
      </OrderLine.Content>
      <OrderLine.DiscountAmount amount={amount} />
    </OrderLine.Root>
  )
}
