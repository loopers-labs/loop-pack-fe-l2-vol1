type Props = {
  amount: number;
  isDiscount?: boolean;
};

// 여기저기서 쓰는 '공통' 금액 표시 컴포넌트.
export function Price({ amount, isDiscount }: Props) {
  return (
    <strong style={{ color: isDiscount ? "#ef4444" : "var(--text-h)" }}>
      {isDiscount ? "- " : ""}
      {amount.toLocaleString()}원
    </strong>
  );
}
