type Props = {
  value: number;
};

// 여기저기서 쓰는 '공통' 금액 표시 컴포넌트.
export function Price({ value }: Props) {
  return <strong>{value.toLocaleString()}원</strong>;
}
