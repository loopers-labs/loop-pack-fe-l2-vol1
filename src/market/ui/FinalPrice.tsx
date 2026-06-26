import { PriceLineRow } from './PriceLineRow';
import { Price } from './Price';
import { SectionContainer } from '../../shared/ui/container';
import type { Coupon } from '../types/types';

export const FinalPrice = ({
  itemTotal,
  shippingFee,
  appliedCoupon,
  couponDiscount,
  pointDiscount,
  finalPrice,
}: {
  itemTotal: number;
  shippingFee: number;
  appliedCoupon: Coupon | null;
  couponDiscount: number;
  pointDiscount: number;
  finalPrice: number;
}) => {
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
