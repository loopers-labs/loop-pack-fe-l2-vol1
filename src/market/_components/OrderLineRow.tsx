/** ⑤ props 과다 + ⑧ 확장은 위임으로: 8개 flat props + type 분기를 children 합성으로 교체, 새 타입 추가 시 내부 수정 불필요 */
export function OrderLineRow({ children }: { children: React.ReactNode }) {
  return <div className="line">{children}</div>
}

const Thumbnail = ({ thumbnail }: { thumbnail: string }) => {
  return <span className="thumb">{thumbnail}</span>
}

const Label = ({ label, option }: { label: string; option?: string }) => {
  return (
    <div className="grow">
      <span>{label}</span>
      {option && <small>{option}</small>}
    </div>
  )
}

const Amount = ({ amount, isDiscount }: { amount: number; isDiscount?: boolean }) => {
  return (
    <strong style={{ color: isDiscount ? '#ef4444' : 'var(--text-h)' }}>
      {isDiscount ? '- ' : ''}
      {amount.toLocaleString()}원
    </strong>
  )
}

OrderLineRow.Thumbnail = Thumbnail
OrderLineRow.Label = Label
OrderLineRow.Amount = Amount
