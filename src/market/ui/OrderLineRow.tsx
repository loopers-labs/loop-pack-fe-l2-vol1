type Props = {
  label: string;
  amount: number;
  thumbnail?: string;
  option?: string;
  quantity?: number;
};

// 1번, 3번 위배 -> 별도의 컴포넌트로 분리하기
export function OrderLineRow({ label, amount, thumbnail, option, quantity }: Props) {
  return (
    <div className="line">
      <span className="thumb">{thumbnail}</span>
      <div className="grow">
        <span>{label}</span>
        {option && (
          <small>
            {option} · 수량 {quantity}
          </small>
        )}
      </div>
      <strong style={{ color: 'var(--text-h)' }}>{amount.toLocaleString()}원</strong>
      {/* 새 줄 타입(부분취소, 선물포장, 결제수단별 즉시할인...)이 생길 때마다 위 분기가 늘어난다 */}
    </div>
  );
}
