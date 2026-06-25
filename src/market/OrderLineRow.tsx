import type { ReactNode } from 'react'

type Props = {
  label: string
  amount: number
  thumbnail?: ReactNode
  meta?: ReactNode
  isDiscount?: boolean
}

// 분기 없는 레이아웃 프리미티브. 줄 타입이 늘어도 이 파일은 바뀌지 않는다.
export function OrderLineRow({ label, amount, thumbnail, meta, isDiscount }: Props) {
  return (
    <div className="line">
      {thumbnail ? <span className="thumb">{thumbnail}</span> : null}
      <div className="grow">
        <span>{label}</span>
        {meta ? <small>{meta}</small> : null}
      </div>
      <strong style={{ color: isDiscount ? '#ef4444' : 'var(--text-h)' }}>
        {isDiscount ? '- ' : ''}
        {amount.toLocaleString()}원
      </strong>
    </div>
  )
}
