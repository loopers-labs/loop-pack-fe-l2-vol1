type OrderLineDiscountAmountProps = {
  amount: number
}

export function OrderLineDiscountAmount({
  amount,
}: OrderLineDiscountAmountProps) {
  return (
    <strong className="whitespace-nowrap text-[#ef4444]">
      - {amount.toLocaleString()}원
    </strong>
  )
}
