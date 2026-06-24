import { OrderLine } from '@/entities/market'

import type { PastOrderLineProps } from './types'

export function PastOrderLine({ order }: PastOrderLineProps) {
  return (
    <OrderLine.Root>
      <OrderLine.Content>{order.summary}</OrderLine.Content>
      <OrderLine.StatusTag status={order.status} />
    </OrderLine.Root>
  )
}
