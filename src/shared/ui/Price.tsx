type PriceProps = {
  amount: number
}

export function Price({ amount }: PriceProps) {
  return <strong>{amount.toLocaleString()}원</strong>
}
