/** ⑤ props 과다 → Composition: 8개 flat props + type 분기를 children 합성으로 교체 */
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
