import { getPriceText } from '@/utils.ts';

type PriceInfoProps = {
  /** 할인 금액 여부 — true면 빨간색과 '-' 접두사로 표시 */
  isDiscount?: boolean;
  /** 표시할 금액 */
  amount?: number;
  /** 표시할 금액 뒤에 붙을 text */
  endAdornment?: string;
};

export function PriceInfo({ isDiscount, amount, endAdornment }: PriceInfoProps) {
  return (
    <strong style={{ color: isDiscount ? '#ef4444' : 'var(--text-h)' }}>
      {isDiscount ? '- ' : ''}
      {getPriceText(amount, endAdornment)}
    </strong>
  );
}
