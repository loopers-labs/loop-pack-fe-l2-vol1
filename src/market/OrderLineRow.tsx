type OrderLineType = 'product' | 'subtotal' | 'shipping' | 'coupon' | 'point'

type Props = {
  type: OrderLineType
  label: string
  amount: number
  thumbnail?: string
  option?: string
  quantity?: number
  isDiscount?: boolean
  couponCode?: string
}

export function OrderLineRow({
  type,
  label,
  amount,
  thumbnail,
  option,
  quantity,
  isDiscount,
  couponCode,
}: Props) {
  return (
    <div className="line">
      {type === 'product' && <span className="thumb">{thumbnail}</span>}
      <div className="grow">
        <span>{label}</span>
        {type === 'product' && option ? (
          <small>
            {option} · 수량 {quantity}
          </small>
        ) : null}
        {type === 'coupon' && couponCode ? <small>{couponCode}</small> : null}
      </div>
      <strong style={{ color: isDiscount ? '#ef4444' : 'var(--text-h)' }}>
        {isDiscount ? '- ' : ''}
        {amount.toLocaleString()}원
      </strong>
      {/* 새 줄 타입(부분취소, 선물포장, 결제수단별 즉시할인...)이 생길 때마다 위 분기가 늘어난다 */}
    </div>
  )
}
