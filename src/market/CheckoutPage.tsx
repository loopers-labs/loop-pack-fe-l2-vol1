import { useState } from "react";

import { DeliveryCard } from "./components/delivery/DeliveryCard";
import { DeliveryMemoCard } from "./components/delivery/DeliveryMemoCard";
import { OrderItemsCard } from "./components/order/OrderItemsCard";
import { RecentOrdersCard } from "./components/order/RecentOrdersCard";
import { PriceSummaryCard } from "./components/price-summary/PriceSummaryCard";
import { TermsCard } from "./components/terms/TermsCard";
import { CouponCard } from "./CouponCard";
import { ADDRESSES, CART, COUPONS, MEMBER } from "./data";
import { OrderCompletePage } from "./OrderCompletePage";
import { PaymentMethodCard } from "./PaymentMethodCard";
import { PointsCard } from "./PointsCard";
import { Price } from "./Price";
import type { Coupon } from "./types";

import "./common.css"; // 공용 스타일 분리dkw

export function CheckoutPage() {
  const member = MEMBER;
  const cart = CART;

  const [selectedAddressId, setSelectedAddressId] = useState(ADDRESSES[0].id);

  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [usePoint, setUsePoint] = useState(false);
  const [pointInput, setPointInput] = useState(0);
  const [agreed, setAgreed] = useState(false);
  const [placed, setPlaced] = useState(false);

  const address = ADDRESSES.find((a) => a.id === selectedAddressId)!;

  // ── 배송비 정책 ──────────────────────────────
  const itemTotal = cart.reduce((sum, it) => sum + it.price * it.quantity, 0);
  let shippingFee = 3000;
  if (itemTotal >= 50000) shippingFee = 0;
  if (address.isRemote) shippingFee += 3000;

  // ── 쿠폰 정책 ────────────────────────────────
  const couponDiscount = appliedCoupon ? appliedCoupon.discount : 0;

  // ── 적립금 정책 ──────────────────────────────
  const pointDiscount = usePoint ? Math.min(pointInput, member.point, itemTotal) : 0;

  // 변경 전: 최종 금액을 state 에 담아둔다.
  // 변경 후: 파생 값이라 state가 아니라 렌더 시 계산. itemTotal/할인 등이 바뀌면 자동으로 다시 계산됨.
  // VIP 등급 할인을 최종 결제 금액에 반영하고 Price를 표시 전용으로 분리
  const vipDiscount = member.grade === "VIP" ? Math.round(itemTotal * 0.1) : 0;
  const finalPrice = itemTotal + shippingFee - vipDiscount - couponDiscount - pointDiscount;

  // 카드는 쿠폰/적립금 객체 전체가 아니라 "할인 줄 표시 여부+값"만 필요하므로,
  // appliedCoupon → couponCode, usePoint → pointApplied로 변환해 넘김.
  const priceSummary = {
    itemTotal,
    shippingFee,
    couponDiscount,
    pointDiscount,
    finalPrice,
    couponCode: appliedCoupon?.code,
    pointApplied: usePoint,
  };

  //appliedCoupon은 쿠폰 카드뿐 아니라 결제 금액 계산(couponDiscount → finalPrice)도 읽는 공유 상태라 공통 부모인 CheckoutPage에서 관리
  //따라서, 그 값을 바꾸는 이 핸들러도 페이지에 둠. CouponCard는 onApply로 "적용" 요청만 실행하도록 분리
  const handleApplyCoupon = (code: string) => {
    const found = COUPONS.find((c) => c.code === code.trim());
    //못 찾은 경우를 먼저 처리(early return). 성공 케이스를 아래에 두어 "검증 먼저, 처리 나중"
    //단일 적용 방식이라, 새 코드가 틀리면 기존에 적용된 쿠폰도 무효화
    if (!found) {
      alert("존재하지 않는 쿠폰이에요");
      setAppliedCoupon(null);
      return;
    }
    setAppliedCoupon(found);
  };

  if (placed) {
    return <OrderCompletePage finalPrice={finalPrice} onBack={() => setPlaced(false)} />;
  }

  return (
    <div className="checkout">
      <h1>주문/결제</h1>

      <DeliveryCard
        addresses={ADDRESSES}
        selectedAddressId={selectedAddressId}
        onSelectAddress={setSelectedAddressId}
      />

      <DeliveryMemoCard />

      <OrderItemsCard items={cart} />

      <CouponCard appliedCoupon={appliedCoupon} onApply={handleApplyCoupon} />

      <PointsCard
        point={member.point}
        usePoint={usePoint}
        pointInput={pointInput}
        onUsePointChange={setUsePoint}
        onPointInputChange={setPointInput}
      />

      <PaymentMethodCard />

      <PriceSummaryCard summary={priceSummary} />

      <TermsCard agreed={agreed} onAgreedChange={setAgreed} />

      <button className="pay" disabled={!agreed} onClick={() => setPlaced(true)}>
        {/* 금액 표시는 공통 Price 컴포넌트 사용으로 변경 */}
        <Price amount={finalPrice} /> 결제하기
      </button>

      <RecentOrdersCard />
    </div>
  );
}
