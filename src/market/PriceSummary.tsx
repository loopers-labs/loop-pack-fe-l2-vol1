import { OrderLineRow } from './OrderLineRow';
import { Price } from './Price';
import type { Coupon, Member } from './types';

type Amount = {
  itemTotal: number;
  shippingFee: number;
  couponDiscount: number;
  pointDiscount: number;
  finalPrice: number;
};

type Props = {
  amount: Amount;
  appliedCoupon: Coupon | null;
  usePoint: boolean;
  member: Member;
};

export function PriceSummary({
  amount,
  appliedCoupon,
  usePoint,
  member,
}: Props) {
  return (
    <>
      <OrderLineRow
        type="subtotal"
        label="상품 금액"
        amount={amount.itemTotal}
      />
      <OrderLineRow
        type="shipping"
        label="배송비"
        amount={amount.shippingFee}
      />
      {appliedCoupon ? (
        <OrderLineRow
          type="coupon"
          label="쿠폰 할인"
          amount={amount.couponDiscount}
          isDiscount
          couponCode={appliedCoupon.code}
        />
      ) : null}
      {usePoint ? (
        <OrderLineRow
          type="point"
          label="적립금 사용"
          amount={amount.pointDiscount}
          isDiscount
        />
      ) : null}
      <div className="total">
        <span>최종 결제 금액</span>
        <Price amount={amount.finalPrice} member={member} />
      </div>
    </>
  );
}
