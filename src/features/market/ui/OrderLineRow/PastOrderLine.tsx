import { OrderLine } from '@/entities/market'

import type { PastOrderLineProps } from './types'

export function PastOrderLine({ pastOrder }: PastOrderLineProps) {
  return (
    <OrderLine.Root>
      <OrderLine.Content>{pastOrder.summary}</OrderLine.Content>
      <OrderLine.StatusTag status={pastOrder.status} />
    </OrderLine.Root>
  )
}
