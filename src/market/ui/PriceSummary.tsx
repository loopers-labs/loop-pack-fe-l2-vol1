import { PriceLineRow } from './PriceLineRow';
import { Price } from './Price';
import { SectionContainer } from '../shared/ui/container';
import type { Coupon, PaymentAmounts } from '../shared/types/types';

export const PriceSummary = ({
  appliedCoupon,
  amount,
  finalPrice,
}: {
  appliedCoupon: Coupon | null;
  amount: PaymentAmounts;
  finalPrice: number;
}) => {
  const { itemTotal, shippingFee, couponDiscount, pointDiscount } = amount;
  return (
    <SectionContainer title="결제 금액">
      <PriceLineRow type="subtotal" amount={itemTotal} />
      <PriceLineRow type="shipping" amount={shippingFee} />
      {appliedCoupon && couponDiscount > 0 ? (
        <PriceLineRow type="coupon" amount={couponDiscount} couponCode={appliedCoupon.code} />
      ) : null}
      {/* usePoint를 내려주지 않고도 pointDiscount만으로 판단가능 */}
      {pointDiscount > 0 ? <PriceLineRow type="point" amount={pointDiscount} /> : null}
      <div className="total">
        <span>최종 결제 금액</span>
        <Price value={finalPrice} />
      </div>
    </SectionContainer>
  );
};
