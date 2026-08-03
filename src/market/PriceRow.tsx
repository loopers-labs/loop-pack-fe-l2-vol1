type Props = {
  label: string;
  amount: number;
  isDiscount?: boolean;
  subText?: string;
};
export function PriceRow({ label, amount, isDiscount, subText }: Props) {
  return (
    <div className="line">
      <div className="grow">
        <span>{label}</span>
        {subText ? <small>{subText}</small> : null}
      </div>
      <strong style={{ color: isDiscount ? '#ef4444' : 'var(--text-h)' }}>
        {isDiscount ? '- ' : ''}
        {amount.toLocaleString()}원
      </strong>
    </div>
  );
}
