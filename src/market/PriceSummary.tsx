import { OrderLineRow } from './OrderLineRow';
import { Price } from './Price';
import type { Coupon } from './types';

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
};

export function PriceSummary({ amount, appliedCoupon, usePoint }: Props) {
  return (
    <>
      <OrderLineRow>
        <OrderLineRow.Label>상품 금액</OrderLineRow.Label>
        <OrderLineRow.Amount amount={amount.itemTotal} />
      </OrderLineRow>

      <OrderLineRow>
        <OrderLineRow.Label>배송비</OrderLineRow.Label>
        <OrderLineRow.Amount amount={amount.shippingFee} />
      </OrderLineRow>

      {appliedCoupon ? (
        <OrderLineRow>
          <OrderLineRow.Label caption={appliedCoupon.code}>
            쿠폰 할인
          </OrderLineRow.Label>
          <OrderLineRow.Amount amount={amount.couponDiscount} isDiscount />
        </OrderLineRow>
      ) : null}

      {usePoint ? (
        <OrderLineRow>
          <OrderLineRow.Label>적립금 사용</OrderLineRow.Label>
          <OrderLineRow.Amount amount={amount.pointDiscount} isDiscount />
        </OrderLineRow>
      ) : null}
      <div className="total">
        <span>최종 결제 금액</span>
        <Price amount={amount.finalPrice} />
      </div>
    </>
  );
}
