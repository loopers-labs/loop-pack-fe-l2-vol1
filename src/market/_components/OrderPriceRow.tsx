export const OrderPriceRow = ({ children }: { children: React.ReactNode }) => (
  <div className="line">{children}</div>
)

const Label = ({ label, option }: { label: string; option?: string }) => (
  <div className="grow">
    <span>{label}</span>
    {option && <small>{option}</small>}
  </div>
)

const Amount = ({ amount, isDiscount }: { amount: number; isDiscount?: boolean }) => (
  <strong style={{ color: isDiscount ? '#ef4444' : 'var(--text-h)' }}>
    {isDiscount ? '- ' : ''}
    {amount.toLocaleString()}원
  </strong>
)

OrderPriceRow.Label = Label
OrderPriceRow.Amount = Amount
