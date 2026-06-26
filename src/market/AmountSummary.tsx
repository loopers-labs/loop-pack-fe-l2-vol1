import type { Coupon, Member } from "./types";
import type { OrderAmount } from "./orderAmount";
import { OrderLineRow } from "./OrderLineRow";
import { formatWon } from "./format";

type Props = {
  amount: OrderAmount;
  appliedCoupon: Coupon | null;
  usePoint: boolean;
  memberGrade: Member["grade"];
};

// 결제 금액 내역 — 계산 결과(OrderAmount)를 받아 표시만 한다(상태 조작 없음).
export function AmountSummary({ amount, appliedCoupon, usePoint, memberGrade }: Props) {
  return (
    <div className="section">
      <h2>결제 금액</h2>
      <OrderLineRow amount={amount.itemTotal}>
        <span>상품 금액</span>
      </OrderLineRow>
      <OrderLineRow amount={amount.shippingFee}>
        <span>배송비</span>
      </OrderLineRow>
      {appliedCoupon ? (
        <OrderLineRow amount={amount.couponDiscount} isDiscount>
          <span>쿠폰 할인</span>
          <small>{appliedCoupon.code}</small>
        </OrderLineRow>
      ) : null}
      {usePoint ? (
        <OrderLineRow amount={amount.pointDiscount} isDiscount>
          <span>적립금 사용</span>
        </OrderLineRow>
      ) : null}
      {amount.gradeDiscount > 0 ? (
        <OrderLineRow amount={amount.gradeDiscount} isDiscount>
          <span>등급 할인</span>
          <small>{memberGrade}</small>
        </OrderLineRow>
      ) : null}
      <div className="total">
        <span>최종 결제 금액</span>
        <strong>{formatWon(amount.finalPrice)}</strong>
      </div>
    </div>
  );
}
