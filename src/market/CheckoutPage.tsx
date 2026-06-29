import { useState } from 'react';
import type {
  Coupon as CouponType,
  PaymentMethod as PaymentMethodType,
} from './shared/types/types';
import { ADDRESSES, CART, COUPONS, MEMBER } from './data';
import './market.css';
import { Delivery } from './ui/Delivery';
import { CheckoutContainer } from './shared/ui/container';
import { Coupon } from './ui/Coupon';
import { OrderItem } from './ui/OrderItem';
import { Request } from './ui/Request';
import { Point } from './ui/Point';
import { CheckoutComplete } from './ui/CheckoutComplete';
import { PastOrder } from './ui/PastOrder';
import { PaymentMethod } from './ui/PaymentMethod';
import { PriceSummary } from './ui/PriceSummary';
import { Terms } from './ui/Terms';
import { ModalProvider } from '../shared/ui/modal/ModalProvider';
import { TermsModal } from './ui/TermsModal';
import { Price } from './ui/Price';
import {
  calculateFinalPrice,
  calculateMemberDiscount,
  calculatePointDiscount,
  calculateShippingFee,
  calculateTotal,
  calulateCouponDiscount,
} from './utils';

// 결제 페이지 전체의 흐름과 레이아웃이라는 페이지 컴포넌트 본연의 역할에만 집중할 수 있도록(1, 2, 3 위배)
export function CheckoutPage() {
  const member = MEMBER;
  const cart = CART;

  const [selectedAddressId, setSelectedAddressId] = useState(ADDRESSES[0].id);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<CouponType | null>(null);
  const [pointInput, setPointInput] = useState(member.point); // 기본적으로 최대 적립금이 적용되도록 변경
  const [payment, setPayment] = useState<PaymentMethodType>('card');
  const [agreed, setAgreed] = useState(false);
  const [placed, setPlaced] = useState(false);

  const address = ADDRESSES.find((a) => a.id === selectedAddressId)!;

  const itemTotal = calculateTotal(cart);
  const amount = {
    itemTotal,
    shippingFee: calculateShippingFee(itemTotal, address.isRemote),
    couponDiscount: calulateCouponDiscount(appliedCoupon),
    memberDiscount: calculateMemberDiscount(itemTotal, member),
    pointDiscount: calculatePointDiscount(pointInput, member.point, itemTotal),
  };

  const finalPrice = calculateFinalPrice(amount);

  const handleApplyCoupon = () => {
    const found = COUPONS.find((c) => c.code === couponCode.trim());
    setAppliedCoupon(found ?? null);
    if (!found) alert('존재하지 않는 쿠폰이에요');
  };

  // 연관 상태: 최종 금액, placed 상태
  if (placed) {
    return (
      <CheckoutComplete finalPrice={finalPrice} onCheckoutButtonClick={() => setPlaced(false)} />
    );
  }

  return (
    <CheckoutContainer>
      <ModalProvider>
        <Delivery
          addresses={ADDRESSES}
          selectedAddressId={selectedAddressId}
          onSelectAddress={setSelectedAddressId}
        />

        <Request />

        <OrderItem />

        <Coupon
          couponCode={couponCode}
          appliedCoupon={appliedCoupon}
          onInputChange={(e) => setCouponCode(e.target.value)}
          onApplyButtonClick={handleApplyCoupon}
        />

        <Point
          pointInput={pointInput}
          availablePoint={member.point}
          onInputChange={setPointInput}
        />

        <PaymentMethod payment={payment} onPaymentMethodChange={(m) => setPayment(m)} />

        <PriceSummary appliedCoupon={appliedCoupon} amount={amount} finalPrice={finalPrice} />

        <Terms
          agreed={agreed}
          onToggleCheckbox={(e: React.ChangeEvent<HTMLInputElement>) => setAgreed(e.target.checked)}
        />

        <button className="pay" disabled={!agreed} onClick={() => setPlaced(true)}>
          {/* 공통 가격 컴포넌트를 결제 버튼에도 반영 */}
          <Price value={finalPrice} /> 결제하기
        </button>
        <TermsModal />
        <PastOrder />
      </ModalProvider>
    </CheckoutContainer>
  );
}
