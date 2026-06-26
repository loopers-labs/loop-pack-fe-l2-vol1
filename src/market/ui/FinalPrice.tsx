import { PriceLineRow } from './PriceLineRow';
import { Price } from './Price';
import { SectionContainer } from '../../shared/ui/container';

export const FinalPrice = ({
  itemTotal,
  shippingFee,
  couponDiscount,
  pointDiscount,
  finalPrice,
}: {
  itemTotal: number;
  shippingFee: number;
  couponDiscount: number;
  pointDiscount: number;
  finalPrice: number;
}) => {
  return (
    <SectionContainer title="결제 금액">
      <PriceLineRow type="subtotal" amount={itemTotal} />
      <PriceLineRow type="shipping" amount={shippingFee} />
      {couponDiscount > 0 ? (
        // appliedCoupon을 내려주지 않고도 couponDiscount만으로 판단가능
        <PriceLineRow type="coupon" amount={couponDiscount} />
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
