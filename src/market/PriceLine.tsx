import { Price } from './Price';

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
      <Price amount={amount} variant={isDiscount ? 'discount' : 'default'} />
    </div>
  );
}
