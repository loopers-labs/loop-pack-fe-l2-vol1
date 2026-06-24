import { DiscountAmountLine, SummaryAmountLine } from "./OrderLines";
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
      <SummaryAmountLine label="상품 금액" amount={itemTotal} />
      <SummaryAmountLine label="배송비" amount={shippingFee} />
      {appliedCoupon ? (
        <DiscountAmountLine
          label="쿠폰 할인"
          amount={couponDiscount}
          description={appliedCoupon.code}
        />
      ) : null}
      {isUsingPoint ? <DiscountAmountLine label="적립금 사용" amount={pointDiscount} /> : null}
      <div className="total">
        <span>최종 결제 금액</span>
        <Price amount={finalPrice} member={member} />
      </div>
    </div>
  );
}
