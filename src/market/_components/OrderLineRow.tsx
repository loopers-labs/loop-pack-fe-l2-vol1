// type별로 의미있는 props가 달라서 유니온으로 잘못된 조합을 타입에서 막음
type Props =
  | {
      type: 'product';
      label: string;
      amount: number;
      thumbnail: string;
      option?: string;
      quantity: number;
    }
  | { type: 'subtotal' | 'shipping'; label: string; amount: number }
  | {
      type: 'coupon';
      label: string;
      amount: number;
      isDiscount: true;
      couponCode: string;
    }
  | { type: 'point'; label: string; amount: number; isDiscount: true };

export function OrderLineRow(props: Props) {
  const { type, label, amount } = props;
  const isDiscount = type === 'coupon' || type === 'point';

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
        {type === 'coupon' ? <small>{props.couponCode}</small> : null}
      </div>
      <strong style={{ color: isDiscount ? '#ef4444' : 'var(--text-h)' }}>
        {isDiscount ? '- ' : ''}
        {amount.toLocaleString()}원
      </strong>
    </div>
  );
}
