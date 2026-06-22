import type { OrderStatus } from '../entities/market'

type Props = {
  status: OrderStatus
}

const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  paid: '결제완료',
  preparing: '상품 준비중',
  shipped: '배송중',
  delivered: '배송완료',
  cancelled: '주문취소',
}

const ORDER_STATUS_COLOR: Record<OrderStatus, string> = {
  paid: '#3b82f6',
  preparing: '#f59e0b',
  shipped: '#8b5cf6',
  delivered: '#22c55e',
  cancelled: '#ef4444',
}

export function OrderStatusTag({ status }: Props) {
  const label = ORDER_STATUS_LABEL[status]
  const color = ORDER_STATUS_COLOR[status]

  return (
    <span className="tag" style={{ color, border: `1px solid ${color}` }}>
      {label}
    </span>
  )
}
