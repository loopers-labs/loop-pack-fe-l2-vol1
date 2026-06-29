import type { OrderStatus } from '../../model'

type OrderLineStatusTagProps = {
  status: OrderStatus
}

export const ORDER_STATUS_DICT: Record<
  OrderStatus,
  { label: string; color: string }
> = {
  paid: { label: '결제완료', color: '#3b82f6' },
  preparing: { label: '상품 준비중', color: '#f59e0b' },
  shipped: { label: '배송중', color: '#8b5cf6' },
  delivered: { label: '배송완료', color: '#22c55e' },
  cancelled: { label: '주문취소', color: '#ef4444' },
}

export function OrderLineStatusTag({ status }: OrderLineStatusTagProps) {
  const { label, color } = ORDER_STATUS_DICT[status]

  return (
    <span
      className="rounded-full border px-2.25 py-0.75 text-xs whitespace-nowrap"
      style={{ color, borderColor: color }}
    >
      {label}
    </span>
  )
}
