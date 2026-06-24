type PriceProps = {
  value: number
}

export function Price({ value }: PriceProps) {
  return <strong>{value.toLocaleString()}원</strong>
}
