import { PriceLineRow } from './PriceLineRow';
import { Price } from './Price';
import type { Coupon } from '../types/types';
import { SectionContainer } from '../../shared/ui/container';

// TODO: 전달받는 props에 파생값이 포함되어 있지 않은지 확인하기
// 적립금 적용 시 최종 금액 확인하기
export const FinalPrice = ({
  itemTotal,
  shippingFee,
  appliedCoupon,
  couponDiscount,
  usePoint,
  pointDiscount,
  finalPrice,
}: {
  itemTotal: number;
  shippingFee: number;
  appliedCoupon: Coupon | null;
  couponDiscount: number;
  usePoint: boolean;
  pointDiscount: number;
  finalPrice: number;
}) => {
  return (
    <SectionContainer title="결제 금액">
      <PriceLineRow type="subtotal" amount={itemTotal} />
      <PriceLineRow type="shipping" amount={shippingFee} />
      {appliedCoupon ? (
        // TODO: isDiscount는 couponDiscount로 판단 가능
        <PriceLineRow type="coupon" amount={couponDiscount} couponCode={appliedCoupon.code} />
      ) : null}
      {usePoint ? <PriceLineRow type="point" amount={pointDiscount} /> : null}
      <div className="total">
        <span>최종 결제 금액</span>
        <Price value={finalPrice} />
      </div>
    </SectionContainer>
  );
};
