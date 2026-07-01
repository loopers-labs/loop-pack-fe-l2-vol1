export const OrderItemRow = ({ children }: { children: React.ReactNode }) => (
  <div className="line">{children}</div>
)

const Thumbnail = ({ thumbnail }: { thumbnail: string }) => (
  <span className="thumb">{thumbnail}</span>
)

const Label = ({ label, option }: { label: string; option?: string }) => (
  <div className="grow">
    <span>{label}</span>
    {option && <small>{option}</small>}
  </div>
)

const Amount = ({ amount }: { amount: number }) => (
  <strong style={{ color: 'var(--text-h)' }}>{amount.toLocaleString()}원</strong>
)

OrderItemRow.Thumbnail = Thumbnail
OrderItemRow.Label = Label
OrderItemRow.Amount = Amount
