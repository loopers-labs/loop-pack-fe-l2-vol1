import type { OrderStatus, PastOrder } from '@/market/types/order.types';
import { Tag } from '@/common/components/Tag.tsx';
import { Section } from '@/common/components/Section.tsx';
import { LineRow } from '@/common/components/LineRow.tsx';

const ORDER_STATUS_PRESET: Record<OrderStatus, { label: string; color: string }> = {
  paid: { label: '결제완료', color: '#3b82f6' },
  preparing: { label: '상품 준비중', color: '#f59e0b' },
  shipped: { label: '배송중', color: '#8b5cf6' },
  delivered: { label: '배송완료', color: '#22c55e' },
  cancelled: { label: '주문취소', color: '#ef4444' },
};

type Props = {
  orders: PastOrder[];
};

export function RecentOrdersSection({ orders }: Props) {
  return (
    <Section title={'최근 주문'}>
      {orders.map((order) => {
        const preset = ORDER_STATUS_PRESET[order.status];
        return (
          <LineRow key={order.id} rightSlot={<Tag label={preset.label} color={preset.color} />}>
            {order.summary}
          </LineRow>
        );
      })}
    </Section>
  );
}
