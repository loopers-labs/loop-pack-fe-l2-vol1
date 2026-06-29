import type { Coupon } from "../types";
import { DiscountAmountLine, SummaryAmountLine } from "../ui/OrderLines";
import { Section } from "../ui/Section";

type PaymentSummarySectionProps = {
  itemTotal: number;
  shippingFee: number;
  appliedCoupon: Coupon | null;
  couponDiscount: number;
  pointDiscount: number;
  isUsingPoint: boolean;
  finalPrice: number;
};

export function PaymentSummarySection({
  itemTotal,
  shippingFee,
  appliedCoupon,
  couponDiscount,
  pointDiscount,
  isUsingPoint,
  finalPrice,
}: PaymentSummarySectionProps) {
  return (
    <Section title="결제 금액">
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
        <strong>{finalPrice.toLocaleString()}원</strong>
      </div>
    </Section>
  );
}
