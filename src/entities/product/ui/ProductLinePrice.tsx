import { getProductDiscount } from '@/entities/product/lib/productPricing';
import type { Product } from '@/entities/product/model/types';
import { formatWon } from '@/shared/lib/format';

interface ProductLinePriceProps {
  product: Product;
  quantity: number;
}

export function ProductLinePrice({
  product,
  quantity,
}: ProductLinePriceProps) {
  const discount = getProductDiscount(product);

  return (
    <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between sm:gap-3">
      <div className="min-w-0">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-[13px]">
          {discount && (
            <strong className="font-semibold text-discount">
              {discount.rate}%
            </strong>
          )}
          <span className="font-medium text-text">
            {formatWon(product.price)}
          </span>
          {discount && (
            <del className="text-text-caption">
              {formatWon(discount.originalPrice)}
            </del>
          )}
          <span className="text-text-secondary">× {quantity}</span>
        </div>
        {discount && (
          <p className="mt-1 text-xs font-medium text-discount">
            할인 금액 -{formatWon(discount.unitAmount * quantity)}
          </p>
        )}
      </div>
      <strong className="shrink-0 text-[14px] font-semibold tabular-nums text-text">
        {formatWon(product.price * quantity)}
      </strong>
    </div>
  );
}
