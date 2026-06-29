import { OrderLine } from '@/entities/market'

import type { CartItemOrderLineProps } from './types'

export function CartItemOrderLine({ cartItem }: CartItemOrderLineProps) {
  return (
    <OrderLine.Root>
      <OrderLine.Thumbnail>{cartItem.thumbnail}</OrderLine.Thumbnail>
      <OrderLine.Content>
        <OrderLine.Title>{cartItem.name}</OrderLine.Title>
        <OrderLine.Description>
          {cartItem.option} · 수량 {cartItem.quantity}
        </OrderLine.Description>
      </OrderLine.Content>
      <OrderLine.Amount amount={cartItem.totalPrice} />
    </OrderLine.Root>
  )
}
