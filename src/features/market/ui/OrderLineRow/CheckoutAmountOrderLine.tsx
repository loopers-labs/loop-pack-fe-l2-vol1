import { OrderLine } from '@/entities/market'

import type { CheckoutAmountOrderLineProps } from './types'

export function CheckoutAmountOrderLine({
  label,
  amount,
}: CheckoutAmountOrderLineProps) {
  return (
    <OrderLine.Root>
      <OrderLine.Content>
        <OrderLine.Title>{label}</OrderLine.Title>
      </OrderLine.Content>
      <OrderLine.Amount amount={amount} />
    </OrderLine.Root>
  )
}
