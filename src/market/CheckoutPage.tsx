import { useState } from "react";
import type { Coupon, PaymentMethod } from "./types";
import { ADDRESSES, CART, MEMBER, PAST_ORDERS } from "./data";
import {
  calculateItemTotal,
  calculateShippingFee,
  calculateCouponDiscount,
  calculatePointDiscount,
  calculateFinalPrice,
} from "../utils";
import "./market.css";
import OrderComplete from "./components/OrderComplete";
import DeliverySection from "./components/DeliverySection";
import DeliveryMemoSection from "./components/DeliveryMemoSection";
import OrderItemList from "./components/OrderItemList";
import CouponSection from "./components/CouponSection";
import PointSection from "./components/PointSection";
import PaymentMethodSection from "./components/PaymentMethodSection";
import PaymentSummary from "./components/PaymentSummary";
import TermsAgreement from "./components/TermsAgreement";
import PlaceOrderButton from "./components/PlaceOrderButton";
import RecentOrders from "./components/RecentOrders";

export function CheckoutPage() {
  const member = MEMBER;
  const cart = CART;

  const [selectedAddressId, setSelectedAddressId] = useState(ADDRESSES[0].id);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [pointInput, setPointInput] = useState(0);
  const [payment, setPayment] = useState<PaymentMethod>("card");
  const [agreed, setAgreed] = useState(false);
  const [placed, setPlaced] = useState(false);

  const address = ADDRESSES.find((a) => a.id === selectedAddressId)!;

  const itemTotal = calculateItemTotal(cart);
  const shippingFee = calculateShippingFee(itemTotal, address.isRemote);
  const couponDiscount = calculateCouponDiscount(appliedCoupon);
  const pointDiscount = calculatePointDiscount(
    pointInput,
    member.point,
    itemTotal,
  );

  const finalPrice = calculateFinalPrice(
    itemTotal,
    shippingFee,
    couponDiscount,
    pointDiscount,
    member,
  );

  if (placed) {
    return (
      <OrderComplete
        finalPrice={finalPrice}
        onBackToCheckout={() => setPlaced(false)}
      />
    );
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

      <OrderItemList items={cart} />

      <CouponSection appliedCoupon={appliedCoupon} onApply={setAppliedCoupon} />

      <PointSection
        memberPoint={member.point}
        pointInput={pointInput}
        onChangePointInput={setPointInput}
      />

      <PaymentMethodSection payment={payment} onChangePayment={setPayment} />

      <PaymentSummary
        itemTotal={itemTotal}
        shippingFee={shippingFee}
        couponDiscount={couponDiscount}
        pointDiscount={pointDiscount}
        finalPrice={finalPrice}
        appliedCoupon={appliedCoupon}
      />

      <TermsAgreement agreed={agreed} onChangeAgreed={setAgreed} />

      <PlaceOrderButton
        finalPrice={finalPrice}
        disabled={!agreed}
        onPlaceOrder={() => setPlaced(true)}
      />

      <RecentOrders orders={PAST_ORDERS} />
    </div>
  );
}
