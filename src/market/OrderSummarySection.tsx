import type { Coupon } from './types';
import { PriceLine } from './PriceLine';
import { Price } from './Price';

interface OrderSummarySectionProps {
  itemTotal: number;
  shippingFee: number;
  appliedCoupon: Coupon | null;
  pointDiscount: number;
  finalPrice: number;
}

export function OrderSummarySection({ itemTotal, shippingFee, appliedCoupon, pointDiscount, finalPrice }: OrderSummarySectionProps) {
  return (
    <div className="section">
      <h2>결제 금액</h2>
      <PriceLine label="상품 금액" amount={itemTotal} />
      <PriceLine label="배송비" amount={shippingFee} />
      {appliedCoupon ? <PriceLine label="쿠폰 할인" amount={appliedCoupon.discount} isDiscount subLabel={appliedCoupon.code} /> : null}
      {pointDiscount > 0 ? <PriceLine label="적립금 사용" amount={pointDiscount} isDiscount /> : null}
      <div className="total">
        <span>최종 결제 금액</span>
        <Price amount={finalPrice} />
      </div>
    </div>
  );
}
