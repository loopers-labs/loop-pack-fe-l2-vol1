import { For } from '@ilokesto/utilinent'

import type { CartItem } from '@/entities/market'
import { OrderLineRow } from '@/features/market'
import { Heading, SectionCard } from '@/shared/ui'

type OrderItemsSectionProps = {
  items: Array<CartItem>
}

export function OrderItemsSection({ items }: OrderItemsSectionProps) {
  return (
    <SectionCard>
      <Heading.H2>주문 상품</Heading.H2>
      <For each={items}>
        {(item) => <OrderLineRow key={item.id} kind="cart-item" item={item} />}
      </For>
    </SectionCard>
  )
}
