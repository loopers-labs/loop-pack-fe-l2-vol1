import { Show } from '@ilokesto/utilinent'

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
  const productOption = type === 'product' ? option : null
  const visibleCouponCode = type === 'coupon' ? couponCode : null

  return (
    <div className="line">
      <Show when={type === 'product'}>
        <span className="thumb">{thumbnail}</span>
      </Show>
      <div className="grow">
        <span>{label}</span>
        <Show when={productOption}>
          {(selectedOption) => (
            <small>
              {selectedOption} · 수량 {quantity}
            </small>
          )}
        </Show>
        <Show when={visibleCouponCode}>
          {(selectedCouponCode) => <small>{selectedCouponCode}</small>}
        </Show>
      </div>
      <strong style={{ color: isDiscount ? '#ef4444' : 'var(--text-h)' }}>
        <Show when={isDiscount}>- </Show>
        {amount.toLocaleString()}원
      </strong>
      {/* 새 줄 타입(부분취소, 선물포장, 결제수단별 즉시할인...)이 생길 때마다 위 분기가 늘어난다 */}
    </div>
  )
}
