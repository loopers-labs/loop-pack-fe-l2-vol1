import type { ProductOrderLine } from './checkoutModel'

// 상품 줄 전용. 썸네일·옵션·수량을 가진다 — 금액 줄과 표시 약속이 다르다.
export function ProductLineRow({
  thumbnail,
  label,
  option,
  quantity,
  amount,
}: ProductOrderLine) {
  return (
    <div className="line">
      <span className="thumb">{thumbnail}</span>
      <div className="grow">
        <span>{label}</span>
        <small>
          {option} · 수량 {quantity}
        </small>
      </div>
      <strong style={{ color: 'var(--text-h)' }}>
        {amount.toLocaleString('ko-KR')}원
      </strong>
    </div>
  )
}
