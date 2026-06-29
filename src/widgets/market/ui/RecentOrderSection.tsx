import { For } from '@ilokesto/utilinent'

import { marketService } from '@/entities/market'
import { OrderLineRow } from '@/features/market'
import { Heading, SectionCard } from '@/shared/ui'

export function RecentOrderSection() {
  const pastOrders = marketService.getPastOrders()

  return (
    <SectionCard>
      <Heading.H2>최근 주문</Heading.H2>
      <For each={pastOrders}>
        {(order) => (
          <OrderLineRow key={order.id} kind="past-order" pastOrder={order} />
        )}
      </For>
    </SectionCard>
  )
}
