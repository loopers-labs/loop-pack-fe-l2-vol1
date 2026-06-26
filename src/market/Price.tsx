interface PriceProps {
  amount: number;
}

// 금액 표시 전용 컴포넌트.
// 등급 할인 등 금액 계산은 호출부(checkoutPage)가 책임지고, Price는 받은 값을 표시만 함.
// 이전엔 member를 받아 VIP 할인까지 계산했으나, 표시와 계산이 섞여 실제 결제액과 표시액이 어긋나는 문제가 있어 계산을 분리
export function Price({ amount }: PriceProps) {
  return <strong>{amount.toLocaleString()}원</strong>;
}
