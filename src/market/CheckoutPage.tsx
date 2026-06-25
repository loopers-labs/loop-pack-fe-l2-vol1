import { useState } from 'react';
import type { Coupon } from './types/coupon.types';
import type { PaymentMethod } from './types/payment.types';
import { ADDRESSES, CART, COUPONS, MEMBER, PAST_ORDERS } from './data';
import { DeliveryMemo } from './components/DeliveryMemo';
import { CartSection } from './sections/CartSection';
import { CouponSection } from './sections/CouponSection';
import { PointSection } from './sections/PointSection';
import { PaymentMethodSection } from './sections/PaymentMethodSection';
import { OrderSummarySection } from './sections/OrderSummarySection';
import { TermsSection } from './sections/TermsSection';
import { RecentOrdersSection } from './sections/RecentOrdersSection';
import './market.css';
import { AddressSection } from './sections/AddressSection';
import { AddressForm } from './sections/AddressSection/AddressForm.tsx';

const BASE_SHIPPING_FEE = 3000;
const FREE_SHIPPING_THRESHOLD = 50000;
const REMOTE_AREA_SURCHARGE = 3000;

export function CheckoutPage() {
  const member = MEMBER;
  const cart = CART;

  const [selectedAddressId, setSelectedAddressId] = useState(ADDRESSES[0].id);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [usePoint, setUsePoint] = useState(false);
  const [pointInput, setPointInput] = useState(0);
  const [payment, setPayment] = useState<PaymentMethod>('card');
  const [agreed, setAgreed] = useState(false);
  const [placed, setPlaced] = useState(false);

  const address = ADDRESSES.find((a) => a.id === selectedAddressId)!;

  // ── 배송비 정책 ──────────────────────────────
  const itemTotal = cart.reduce((sum, it) => sum + it.price * it.quantity, 0);
  let shippingFee = BASE_SHIPPING_FEE;
  if (itemTotal >= FREE_SHIPPING_THRESHOLD) shippingFee = 0;
  if (address.isRemote) shippingFee += REMOTE_AREA_SURCHARGE;

  // ── 쿠폰 정책 ────────────────────────────────
  const couponDiscount = appliedCoupon ? appliedCoupon.discount : 0;

  // ── 적립금 정책 ──────────────────────────────
  const pointDiscount = usePoint ? Math.min(pointInput, member.point, itemTotal) : 0;

  const finalPrice = itemTotal + shippingFee - couponDiscount - pointDiscount;

  const applyCoupon = () => {
    const found = COUPONS.find((c) => c.code === couponCode.trim());
    setAppliedCoupon(found ?? null);
    if (!found) alert('존재하지 않는 쿠폰이에요');
  };

  if (placed) {
    return (
      <div className="checkout">
        <h1>주문 완료</h1>
        <div className="section">
          <p style={{ color: 'var(--text-h)' }}>
            주문이 접수되었어요. 결제 금액 {finalPrice.toLocaleString()}원
          </p>
        </div>
        <button className="pay" onClick={() => setPlaced(false)}>
          주문서로 돌아가기
        </button>
      </div>
    );
  }

  return (
    <div className="checkout">
      <h1>주문/결제</h1>

      <AddressSection selectedAddress={address}>
        <AddressForm
          addresses={ADDRESSES}
          selectedAddressId={selectedAddressId}
          onSelectAddress={setSelectedAddressId}
        />
      </AddressSection>

      <div className="section">
        <h2>배송 요청사항</h2>
        <DeliveryMemo />
      </div>

      <CartSection items={cart} />

      <CouponSection
        couponCode={couponCode}
        onCouponCodeChange={setCouponCode}
        appliedCoupon={appliedCoupon}
        onApply={applyCoupon}
      />

      <PointSection
        usePoint={usePoint}
        onUsePointChange={setUsePoint}
        pointInput={pointInput}
        onPointInputChange={setPointInput}
        availablePoint={member.point}
      />

      <PaymentMethodSection payment={payment} onPaymentChange={setPayment} />

      <OrderSummarySection
        itemTotal={itemTotal}
        shippingFee={shippingFee}
        appliedCoupon={appliedCoupon}
        couponDiscount={couponDiscount}
        usePoint={usePoint}
        pointDiscount={pointDiscount}
        finalPrice={finalPrice}
        member={member}
      />

      <TermsSection agreed={agreed} onAgreedChange={setAgreed} />

      <button className="pay" disabled={!agreed} onClick={() => setPlaced(true)}>
        {finalPrice.toLocaleString()}원 결제하기
      </button>

      <RecentOrdersSection orders={PAST_ORDERS} />
    </div>
  );
}
