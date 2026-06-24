import { MEMBER } from '../data';
import { OrderLineRow } from '../OrderLineRow';
import { Price } from '../Price';
import type { Coupon } from '../types';
import { SectionContainer } from './container';

// TODO: 전달받는 props에 파생값이 포함되어 있지 않은지 확인하기
export const FinalPriceSection = ({
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
  const member = MEMBER;
  return (
    <SectionContainer title="결제 금액">
      <OrderLineRow type="subtotal" label="상품 금액" amount={itemTotal} />
      <OrderLineRow type="shipping" label="배송비" amount={shippingFee} />
      {appliedCoupon ? (
        <OrderLineRow
          type="coupon"
          label="쿠폰 할인"
          amount={couponDiscount}
          isDiscount
          couponCode={appliedCoupon.code}
        />
      ) : null}
      {usePoint ? (
        <OrderLineRow type="point" label="적립금 사용" amount={pointDiscount} isDiscount />
      ) : null}
      <div className="total">
        <span>최종 결제 금액</span>
        <Price amount={finalPrice} member={member} />
      </div>
    </SectionContainer>
  );
};
