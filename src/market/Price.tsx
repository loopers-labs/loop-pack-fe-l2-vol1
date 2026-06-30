// [AI 생성] 표시 전용으로 재작성 — 직접 검토·수정함
type Props = {
  amount: number;
};

// 금액 표시만 담당한다. VIP 할인 같은 가격 정책은 호출부(CheckoutPage)의 책임.
export function Price({ amount }: Props) {
  return <strong>{amount.toLocaleString()}원</strong>;
}
