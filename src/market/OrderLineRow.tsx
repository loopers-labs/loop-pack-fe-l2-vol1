type OrderLineRowProps = {
  label: string;
  amount: number;
  isDiscount?: boolean;
} & (
  | { type: 'product'; thumbnail?: string; option?: string; quantity?: number }
  | { type: 'coupon'; couponCode?: string }
  | { type: 'subtotal' | 'shipping' | 'point' }
);

export function OrderLineRow(props: OrderLineRowProps) {
  const { type, label, amount, isDiscount } = props;
  return (
    <div className="line">
      {type === 'product' && <span className="thumb">{props.thumbnail}</span>}
      <div className="grow">
        <span>{label}</span>
        {type === 'product' && props.option ? (
          <small>
            {props.option} · 수량 {props.quantity}
          </small>
        ) : null}
        {type === 'coupon' && props.couponCode ? (
          <small>{props.couponCode}</small>
        ) : null}
      </div>
      <strong style={{ color: isDiscount ? '#ef4444' : 'var(--text-h)' }}>
        {isDiscount ? '- ' : ''}
        {amount.toLocaleString()}원
      </strong>
      {/* 새 줄 타입(부분취소, 선물포장, 결제수단별 즉시할인...)이 생길 때마다 위 분기가 늘어난다 */}
    </div>
  );
}
