type PriceVariant = 'default' | 'discount' | 'total'; // original (원가) 등 금액 표시 타입 추가 가능

type Props = {
  amount: number;
  variant?: PriceVariant;
};

export function Price({ amount, variant = 'default' }: Props) {
  return (
    <strong className={`price price--${variant}`}>
      {variant === 'discount' ? '- ' : ''}
      {amount.toLocaleString()}원
    </strong>
  );
}
