import { useState } from 'react';
import type { Coupon, PaymentMethod } from './types';
import { ADDRESSES, CART, COUPONS, MEMBER } from './data';
import './market.css';
import { DeliverySection } from './components/DeliverySection';
import { CheckoutContainer } from './components/container';
import { CouponSection } from './components/CouponSection';
import { OrderItemSection } from './components/OrderItemSection';
import { RequestSection } from './components/RequestSection';
import { PointSection } from './components/PointSection';
import { CheckoutComplete } from './components/CheckoutComplete';
import { PastOrderSection } from './components/PastOrderSection';
import { PaymentMethodSection } from './components/PaymentMethodSection';
import { FinalPriceSection } from './components/FinalPriceSection';
import { TermsSection } from './components/TermsSection';

// 결제 페이지 전체의 흐름과 레이아웃이라는 페이지 컴포넌트 본연의 역할에만 집중할 수 있도록(1, 2, 3 위배)
// TODO: 하위 컴포넌트로 전달하는 props의 성격 확인하기
export function CheckoutPage() {
  const member = MEMBER;
  const cart = CART;

  const [selectedAddressId, setSelectedAddressId] = useState(ADDRESSES[0].id);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [usePoint, setUsePoint] = useState(false);
  const [pointInput, setPointInput] = useState(0);
  const [payment, setPayment] = useState<PaymentMethod>('card');
  const [isTermsOpen, setIsTermsOpen] = useState(false);
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

  // 최종 금액은 직접 계산한다.
  // 가격 계산 로직 -> 커스텀 훅으로 빼면 좋을듯?
  const finalPrice = itemTotal + shippingFee - couponDiscount - pointDiscount;

  const handleApplyCoupon = () => {
    const found = COUPONS.find((c) => c.code === couponCode.trim());
    setAppliedCoupon(found ?? null);
    if (!found) alert('존재하지 않는 쿠폰이에요');
  };

  // 연관 상태: 최종 금액, placed 상태
  if (placed) {
    return (
      <CheckoutComplete
        itemTotal={itemTotal}
        shippingFee={shippingFee}
        couponDiscount={couponDiscount}
        pointDiscount={pointDiscount}
        onCheckoutButtonClick={() => setPlaced(false)}
      />
    );
  }

  return (
    <CheckoutContainer>
      <DeliverySection
        addresses={ADDRESSES}
        selectedAddressId={selectedAddressId}
        onSelectAddress={setSelectedAddressId}
      />
      <RequestSection />
      <OrderItemSection />
      <CouponSection
        couponCode={couponCode}
        onInputChange={(e) => setCouponCode(e.target.value)}
        onApplyButtonClick={handleApplyCoupon}
        appliedCoupon={appliedCoupon}
      />
      <PointSection
        usePoint={usePoint}
        onToggleCheckbox={(e) => setUsePoint(e.target.checked)}
        pointInput={pointInput}
        onInputChange={(e) => setPointInput(Number(e.target.value))}
      />

      <PaymentMethodSection payment={payment} onPaymentMethodChange={(m) => setPayment(m)} />
      <FinalPriceSection
        itemTotal={itemTotal}
        shippingFee={shippingFee}
        appliedCoupon={appliedCoupon}
        couponDiscount={couponDiscount}
        usePoint={usePoint}
        pointDiscount={pointDiscount}
        finalPrice={finalPrice}
      />
      <TermsSection
        agreed={agreed}
        onToggleCheckbox={(e: React.ChangeEvent<HTMLInputElement>) => setAgreed(e.target.checked)}
        onButtonClick={() => setIsTermsOpen(true)}
      />
      <button className="pay" disabled={!agreed} onClick={() => setPlaced(true)}>
        {finalPrice.toLocaleString()}원 결제하기
      </button>
      {/* TODO: 모달은 headless ui 패턴으로 관리하고 container(shared) 위치에 함께 두기 */}
      {isTermsOpen ? (
        <div className="modal" onClick={() => setIsTermsOpen(false)}>
          <div className="modal-body" onClick={(e) => e.stopPropagation()}>
            <h3>이용 약관</h3>
            <p>주문 후 7일 이내 단순 변심 반품이 가능하며, 도서산간은 배송비가 추가됩니다.</p>
            <button onClick={() => setIsTermsOpen(false)}>닫기</button>
          </div>
        </div>
      ) : null}
      <PastOrderSection />
    </CheckoutContainer>
  );
}
