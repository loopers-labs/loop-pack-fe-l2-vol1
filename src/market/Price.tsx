type Props = {
  amount: number
}

export function Price({ amount }: Props) {
  return <strong>{amount.toLocaleString('ko-KR')}원</strong>
}
