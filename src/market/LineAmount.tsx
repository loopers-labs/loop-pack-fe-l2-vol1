// [AI 생성] 직접 검토·수정함
// 금액 표시 primitive — 포맷과 할인 스타일(빨강·마이너스)을 한 곳에 가둔다.
type Props = {
  amount: number;
  isDiscount?: boolean;
};

export function LineAmount({ amount, isDiscount }: Props) {
  return (
    <strong style={{ color: isDiscount ? "#ef4444" : "var(--text-h)" }}>
      {isDiscount ? "- " : ""}
      {amount.toLocaleString()}원
    </strong>
  );
}
