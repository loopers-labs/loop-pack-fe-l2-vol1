import { useState } from "react";
import type { Coupon, PaymentMethod } from "./types";
import { ADDRESSES, CART, COUPONS, MEMBER } from "./data";

import "./market.css";
import {
  calculateCouponDiscount,
  calculateShippingFee,
  calculateFinalPrice,
  calculateItemTotal,
  calculatePointDiscount,
} from "./checkoutPrice";
import { CouponSection } from "./CouponSection";
import { PointSection } from "./PointSection";
import { PaymentMethodSection } from "./PaymentMethodSection";
import { TermsAgreementSection } from "./TermsAgreementSection";
import { PaymentSummarySection } from "./PaymentSummarySection";
import { RecentOrdersSection } from "./RecentOrdersSection";
import { DeliverySection } from "./DeliverySection";
import { DeliveryMemoSection } from "./DeliveryMemoSection";
import { OrderItemsSection } from "./OrderItemsSection";
import { OrderCompleteView } from "./OrderCompleteView";

export function CheckoutPage() {
  const member = MEMBER;
  const cart = CART;

  const [selectedAddressId, setSelectedAddressId] = useState(ADDRESSES[0].id);
  const [couponCodeInput, setCouponCodeInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [isUsingPoint, setIsUsingPoint] = useState(false);
  const [pointInput, setPointInput] = useState(0);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>("card");
  const [isTermsAgreed, setIsTermsAgreed] = useState(false);
  const [placed, setPlaced] = useState(false);

  const address = ADDRESSES.find((a) => a.id === selectedAddressId)!;

  // ── 배송비 정책 ──────────────────────────────
  const itemTotal = calculateItemTotal(cart);
  const shippingFee = calculateShippingFee(itemTotal, address.isRemote);

  // ── 쿠폰 정책 ────────────────────────────────
  const couponDiscount = calculateCouponDiscount(appliedCoupon);

  // ── 적립금 정책 ──────────────────────────────
  const pointDiscount = calculatePointDiscount(isUsingPoint, {
    pointInput,
    memberTotalPoint: member.point,
    totalItemAmount: itemTotal,
  });

  const finalPrice = calculateFinalPrice({
    itemTotal,
    shippingFee,
    couponDiscount,
    pointDiscount,
    memberGrade: member.grade,
  });

  const handleApplyCoupon = () => {
    const found = COUPONS.find((c) => c.code === couponCodeInput.trim());
    setAppliedCoupon(found ?? null);
    if (!found) alert("존재하지 않는 쿠폰이에요");
  };

  const handleBackToCheckout = () => {
    setPlaced(false);
  };

  const handlePlaceOrder = () => {
    setPlaced(true);
  };

  if (placed) {
    return <OrderCompleteView finalPrice={finalPrice} onBackToCheckout={handleBackToCheckout} />;
  }

  return (
    <div className="checkout">
      <h1>주문/결제</h1>

      <DeliverySection
        addresses={ADDRESSES}
        selectedAddressId={selectedAddressId}
        onSelectAddress={setSelectedAddressId}
      />

      <DeliveryMemoSection />
      <OrderItemsSection cart={cart} />

      <CouponSection
        couponCodeInput={couponCodeInput}
        appliedCoupon={appliedCoupon}
        onCouponCodeInputChange={setCouponCodeInput}
        onApplyCoupon={handleApplyCoupon}
      />

      <PointSection
        isUsingPoint={isUsingPoint}
        memberPoint={member.point}
        pointInput={pointInput}
        onIsUsingPointChange={setIsUsingPoint}
        onPointInputChange={setPointInput}
      />

      <PaymentMethodSection
        selectedPaymentMethod={selectedPaymentMethod}
        onPaymentMethodChange={setSelectedPaymentMethod}
      />

      <PaymentSummarySection
        itemTotal={itemTotal}
        shippingFee={shippingFee}
        appliedCoupon={appliedCoupon}
        couponDiscount={couponDiscount}
        pointDiscount={pointDiscount}
        isUsingPoint={isUsingPoint}
        finalPrice={finalPrice}
      />

      <TermsAgreementSection
        isTermsAgreed={isTermsAgreed}
        onTermsAgreementChange={setIsTermsAgreed}
      />

      <button className="pay" disabled={!isTermsAgreed} onClick={handlePlaceOrder}>
        {finalPrice.toLocaleString()}원 결제하기
      </button>

      <RecentOrdersSection />
    </div>
  );
}
