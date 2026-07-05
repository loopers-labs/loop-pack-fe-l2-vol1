// 상품 줄 — 썸네일·옵션·수량을 보여준다. 금액 줄(AmountLine)과 책임이 다르다.
type ProductLineProps = {
  label: string;
  amount: number;
  thumbnail?: string;
  option?: string;
  quantity?: number;
};

export function ProductLine({
  label,
  amount,
  thumbnail,
  option,
  quantity,
}: ProductLineProps) {
  return (
    <div className="line">
      <span className="thumb">{thumbnail}</span>
      <div className="grow">
        <span>{label}</span>
        {option ? (
          <small>
            {option} · 수량 {quantity}
          </small>
        ) : null}
      </div>
      <strong style={{ color: 'var(--text-h)' }}>
        {amount.toLocaleString()}원
      </strong>
    </div>
  );
}
