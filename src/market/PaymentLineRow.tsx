import type { PaymentOrderLine } from './checkoutModel'

// 금액 줄 전용. 상품금액·배송비·쿠폰·회원·적립금이 라벨 + 금액 한 줄을 공유한다.
export function PaymentLineRow(props: PaymentOrderLine) {
  const isDiscount =
    props.kind === 'coupon' ||
    props.kind === 'memberDiscount' ||
    props.kind === 'point'

  return (
    <div className="line">
      <div className="grow">
        <span>{props.label}</span>
        {props.kind === 'coupon' ? <small>{props.couponCode}</small> : null}
      </div>
      <strong style={{ color: isDiscount ? '#ef4444' : 'var(--text-h)' }}>
        {isDiscount ? '- ' : ''}
        {props.amount.toLocaleString('ko-KR')}원
      </strong>
    </div>
  )
}
