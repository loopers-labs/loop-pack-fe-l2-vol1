// 금액 줄 — 라벨·금액만 보여준다. subtotal/shipping/point/coupon 4종이 공유한다.
// 쿠폰처럼 부가 설명이 필요한 줄은 caption으로 받는다.
type AmountLineProps = {
  label: string;
  amount: number;
  isDiscount?: boolean;
  caption?: string;
};

export function AmountLine({
  label,
  amount,
  isDiscount,
  caption,
}: AmountLineProps) {
  return (
    <div className="line">
      <div className="grow">
        <span>{label}</span>
        {caption ? <small>{caption}</small> : null}
      </div>
      <strong style={{ color: isDiscount ? '#ef4444' : 'var(--text-h)' }}>
        {isDiscount ? '- ' : ''}
        {amount.toLocaleString()}원
      </strong>
    </div>
  );
}
