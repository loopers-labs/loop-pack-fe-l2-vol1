type OrderLineAmountProps = {
  amount: number
}

export function OrderLineAmount({ amount }: OrderLineAmountProps) {
  return (
    <strong className="whitespace-nowrap text-(--text-h)">
      {amount.toLocaleString()}원
    </strong>
  )
}
