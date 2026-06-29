import { For } from '@ilokesto/utilinent'

import type { CartItem } from '@/entities/market'
import { OrderLineRow } from '@/features/market'
import { Heading, SectionCard } from '@/shared/ui'

type OrderItemsSectionProps = {
  cartItems: Array<CartItem>
}

export function OrderItemsSection({ cartItems }: OrderItemsSectionProps) {
  return (
    <SectionCard>
      <Heading.H2>주문 상품</Heading.H2>
      <For each={cartItems}>
        {(cartItem) => (
          <OrderLineRow
            key={cartItem.id}
            kind="cart-item"
            cartItem={cartItem}
          />
        )}
      </For>
    </SectionCard>
  )
}
