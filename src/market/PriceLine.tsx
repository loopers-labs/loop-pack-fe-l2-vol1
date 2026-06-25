interface PriceLineProps {
  label: string;
  amount: number;
  subLabel?: string;
  isDiscount?: boolean;
}

export function PriceLine({ label, amount, subLabel, isDiscount }: PriceLineProps) {
  return (
    <div className="line">
      <div className="grow">
        <span>{label}</span>
        {subLabel && <small>{subLabel}</small>}
      </div>
      <strong style={{ color: isDiscount ? '#ef4444' : 'var(--text-h)' }}>
        {isDiscount ? '- ' : ''}
        {amount.toLocaleString()}원
      </strong>
    </div>
  );
}
