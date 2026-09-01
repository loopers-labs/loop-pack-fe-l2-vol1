import type { ProductPriceSummary } from '@/entities/product/lib/productPricing';
import { formatWon } from '@/shared/lib/format';

interface ProductPriceDetailsProps {
  summary: ProductPriceSummary;
  finalLabel: string;
}

export function ProductPriceDetails({
  summary,
  finalLabel,
}: ProductPriceDetailsProps) {
  const formattedDiscount =
    summary.discountTotal > 0
      ? `-${formatWon(summary.discountTotal)}`
      : formatWon(0);

  return (
    <dl className="text-[14px] tabular-nums">
      <div className="flex items-center justify-between gap-4 py-2">
        <dt className="text-text-secondary">총 상품 금액</dt>
        <dd className="font-medium text-text">
          {formatWon(summary.originalTotal)}
        </dd>
      </div>
      <div className="flex items-center justify-between gap-4 py-2">
        <dt className="text-text-secondary">할인 금액</dt>
        <dd
          className={
            summary.discountTotal > 0
              ? 'font-semibold text-discount'
              : 'font-medium text-text'
          }
        >
          {formattedDiscount}
        </dd>
      </div>
      <div className="mt-3 flex items-end justify-between gap-4 border-t border-border pt-5">
        <dt className="font-semibold text-text">{finalLabel}</dt>
        <dd className="text-xl font-bold text-text">
          {formatWon(summary.paymentTotal)}
        </dd>
      </div>
    </dl>
  );
}
