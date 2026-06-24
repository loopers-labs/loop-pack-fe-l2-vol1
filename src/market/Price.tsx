type PriceProps = {
  amount: number;
};

// 금액 표시
export function Price({ amount }: PriceProps) {
  return <strong>{amount.toLocaleString()}원</strong>;
}
