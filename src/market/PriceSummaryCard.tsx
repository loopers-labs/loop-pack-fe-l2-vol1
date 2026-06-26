import { Card } from "./card";
import { OrderLineRow } from "./OrderLineRow";
import { Price } from "./Price";
import type { Member } from "./types";

interface PriceSummary {
  itemTotal: number;
  shippingFee: number;
  couponDiscount: number;
  pointDiscount: number;
  finalPrice: number;
  couponCode?: string; // 쿠폰 할인 줄 표시 여부 + 라벨용
  pointApplied: boolean; // 적립금 줄 표시 여부
}

interface PriceSummaryCardProps {
  summary: PriceSummary;
  member?: Member; // 금액 명세가 아니라 Price의 VIP 표시 계산용이라 따로 받음
}

export function PriceSummaryCard({ summary, member }: PriceSummaryCardProps) {
  const {
    itemTotal,
    shippingFee,
    couponDiscount,
    pointDiscount,
    finalPrice,
    couponCode,
    pointApplied,
  } = summary;

  return (
    <Card>
      <Card.Title>결제 금액</Card.Title>
      <Card.Body>
        <OrderLineRow type="subtotal" label="상품 금액" amount={itemTotal} />
        <OrderLineRow type="shipping" label="배송비" amount={shippingFee} />
        {couponCode ? (
          <OrderLineRow
            type="coupon"
            label="쿠폰 할인"
            amount={couponDiscount}
            isDiscount
            couponCode={couponCode}
          />
        ) : null}
        {pointApplied ? (
          <OrderLineRow type="point" label="적립금 사용" amount={pointDiscount} isDiscount />
        ) : null}
        <div className="total">
          <span>최종 결제 금액</span>
          <Price amount={finalPrice} member={member} />
        </div>
      </Card.Body>
    </Card>
  );
}
