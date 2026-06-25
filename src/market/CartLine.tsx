interface CartLineProps {
  label: string;
  amount: number;
  thumbnail?: string;
  option?: string;
  quantity?: number;
}

export function CartLine({ label, amount, thumbnail, option, quantity }: CartLineProps) {
  return (
    <div className="line">
      {thumbnail ? <span className="thumb">{thumbnail}</span> : null}
      <div className="grow">
        <span>{label}</span>
        {option ? (
          <small>
            {option} · 수량 {quantity}
          </small>
        ) : null}
      </div>
      <strong style={{ color: 'var(--text-h)' }}>{amount.toLocaleString()}원</strong>
    </div>
  );
}
