import type { Coupon, Member } from "./types";
import type { OrderAmount } from "./orderAmount";
import { LineRow } from "./LineRow";
import { formatWon } from "./format";

type Props = {
  amount: OrderAmount;
  appliedCoupon: Coupon | null;
  memberGrade: Member["grade"];
};

// 결제 금액 내역 — 계산 결과(OrderAmount)를 받아 표시만 한다(상태 조작 없음).
export function AmountSummary({ amount, appliedCoupon, memberGrade }: Props) {
  return (
    <div className="section">
      <h2>결제 금액</h2>
      <LineRow amount={amount.itemTotal}>
        <span>상품 금액</span>
      </LineRow>
      <LineRow amount={amount.shippingFee}>
        <span>배송비</span>
      </LineRow>
      {amount.couponDiscount > 0 ? (
        <LineRow amount={amount.couponDiscount} isDiscount>
          <span>쿠폰 할인</span>
          <small>{appliedCoupon?.code}</small>
        </LineRow>
      ) : null}
      {amount.pointDiscount > 0 ? (
        <LineRow amount={amount.pointDiscount} isDiscount>
          <span>적립금 사용</span>
        </LineRow>
      ) : null}
      {amount.gradeDiscount > 0 ? (
        <LineRow amount={amount.gradeDiscount} isDiscount>
          <span>등급 할인</span>
          <small>{memberGrade}</small>
        </LineRow>
      ) : null}
      <div className="total">
        <span>최종 결제 금액</span>
        <strong>{formatWon(amount.finalPrice)}</strong>
      </div>
    </div>
  );
}
