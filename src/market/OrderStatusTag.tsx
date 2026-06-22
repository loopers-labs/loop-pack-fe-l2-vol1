type Props = {
  isPaid?: boolean
  isPreparing?: boolean
  isShipped?: boolean
  isDelivered?: boolean
  isCancelled?: boolean
}

export function OrderStatusTag({
  isPaid,
  isPreparing,
  isShipped,
  isDelivered,
  isCancelled,
}: Props) {
  let label = '주문 접수'
  let color = '#9ca3af'

  if (isPaid) {
    label = '결제완료'
    color = '#3b82f6'
  }
  if (isPreparing) {
    label = '상품 준비중'
    color = '#f59e0b'
  }
  if (isShipped) {
    label = '배송중'
    color = '#8b5cf6'
  }
  if (isDelivered) {
    label = '배송완료'
    color = '#22c55e'
  }
  if (isCancelled) {
    label = '주문취소'
    color = '#ef4444'
  }

  return (
    <span className="tag" style={{ color, border: `1px solid ${color}` }}>
      {label}
    </span>
  )
}
