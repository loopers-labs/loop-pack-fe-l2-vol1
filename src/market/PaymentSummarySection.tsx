import { OrderLineRow } from "./OrderLineRow";
import { Price } from "./Price";
import type { Coupon, Member } from "./types";

type PaymentSummarySectionProps = {
  itemTotal: number;
  shippingFee: number;
  appliedCoupon: Coupon | null;
  couponDiscount: number;
  pointDiscount: number;
  isUsingPoint: boolean;
  finalPrice: number;
  member: Member;
};

export function PaymentSummarySection({
  itemTotal,
  shippingFee,
  appliedCoupon,
  couponDiscount,
  pointDiscount,
  isUsingPoint,
  finalPrice,
  member,
}: PaymentSummarySectionProps) {
  return (
    <div className="section">
      <h2>결제 금액</h2>
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
      {isUsingPoint ? (
        <OrderLineRow type="point" label="적립금 사용" amount={pointDiscount} isDiscount />
      ) : null}
      <div className="total">
        <span>최종 결제 금액</span>
        <Price amount={finalPrice} member={member} />
      </div>
    </div>
  );
}
