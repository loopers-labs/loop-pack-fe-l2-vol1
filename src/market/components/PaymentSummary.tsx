import type { Coupon, PaymentAmounts } from "../types";
import { Price } from "./Price";
import { OrderLineRow } from "./OrderLineRow";

export default function PaymentSummary({
  amounts,
  finalPrice,
  appliedCoupon,
}: {
  amounts: PaymentAmounts;
  finalPrice: number;
  appliedCoupon: Coupon | null;
}) {
  const { itemTotal, shippingFee, couponDiscount, pointDiscount } = amounts;

  return (
    <div className="section">
      <h2>결제 금액</h2>
      <OrderLineRow amount={itemTotal}>
        <span>상품 금액</span>
      </OrderLineRow>
      <OrderLineRow amount={shippingFee}>
        <span>배송비</span>
      </OrderLineRow>
      {appliedCoupon ? (
        <OrderLineRow amount={couponDiscount} isDiscount>
          <span>쿠폰 할인</span>
          <small>{appliedCoupon.code}</small>
        </OrderLineRow>
      ) : null}
      {pointDiscount > 0 ? (
        <OrderLineRow amount={pointDiscount} isDiscount>
          <span>적립금 사용</span>
        </OrderLineRow>
      ) : null}
      <div className="total">
        <span>최종 결제 금액</span>
        <Price amount={finalPrice} />
      </div>
    </div>
  );
}
