type PriceProps = {
  amount: number;
};

/**
 * 금액 표시 전용 컴포넌트.
 *
 * - 원인: 표시 컴포넌트에 VIP 할인 계산이 섞여 표시 금액과 결제 금액이 어긋남 → 결과: 도메인 로직을 걷어내 '표시'만 책임지는 순수 컴포넌트가 됨.
 */
export function Price({ amount }: PriceProps) {
  return <strong>{amount.toLocaleString()}원</strong>;
}
