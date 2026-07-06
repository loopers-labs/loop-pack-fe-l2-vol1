type Props = {
  amount: number;
};

// 공통 컴포넌트에 도메인 로직을 두어서는 안 됨 -> VIP 할인 계산을 호출부로
export function Price({ amount }: Props) {
  return <strong>{amount.toLocaleString()}원</strong>;
}
