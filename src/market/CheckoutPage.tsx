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

import { TermsAgreementSection } from "./sections/TermsAgreementSection";
import { RecentOrdersSection } from "./sections/RecentOrdersSection";
import { DeliverySection } from "./sections/DeliverySection";
import { DeliveryMemoSection } from "./sections/DeliveryMemoSection";
import { OrderItemsSection } from "./sections/OrderItemsSection";
import { CouponSection } from "./sections/CouponSection";
import { PaymentMethodSection } from "./sections/PaymentMethodSection";
import { PaymentSummarySection } from "./sections/PaymentSummarySection";
import { PointSection } from "./sections/PointSection";
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
  const [isOrderPlaced, setIsOrderPlaced] = useState(false);

  const address = ADDRESSES.find((a) => a.id === selectedAddressId);

  if (!address) {
    return (
      <div className="checkout">
        <h1>주문/결제</h1>
        <div className="section">
          <p>선택된 배송지를 찾을 수 없습니다.</p>
        </div>
      </div>
    );
  }

  const itemTotal = calculateItemTotal(cart);
  const shippingFee = calculateShippingFee(itemTotal, address.isRemote);

  const couponDiscount = calculateCouponDiscount(appliedCoupon);

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
    setIsOrderPlaced(false);
  };

  const handlePlaceOrder = () => {
    setIsOrderPlaced(true);
  };

  if (isOrderPlaced) {
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
