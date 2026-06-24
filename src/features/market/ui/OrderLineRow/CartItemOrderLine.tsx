import { OrderLine } from '@/entities/market'

import type { CartItemOrderLineProps } from './types'

export function CartItemOrderLine({ item }: CartItemOrderLineProps) {
  return (
    <OrderLine.Root>
      <OrderLine.Thumbnail>{item.thumbnail}</OrderLine.Thumbnail>
      <OrderLine.Content>
        <OrderLine.Title>{item.name}</OrderLine.Title>
        <OrderLine.Description>
          {item.option} · 수량 {item.quantity}
        </OrderLine.Description>
      </OrderLine.Content>
      <OrderLine.Amount amount={item.totalPrice} />
    </OrderLine.Root>
  )
}
