type Props = {
  amount: number
}

export function Price({ amount }: Props) {
  return <strong>{amount.toLocaleString()}원</strong>
}
