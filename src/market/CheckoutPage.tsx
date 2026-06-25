import { useState, useRef } from 'react';
import { CART, MEMBER, PAST_ORDERS } from '@/market/data';
import { DeliveryMemoSection } from '@/market/sections/DeliveryMemoSection';
import type { DeliveryMemoRef } from '@/market/sections/DeliveryMemoSection';
import { CartSection } from '@/market/sections/CartSection';
import { CouponSection } from '@/market/sections/CouponSection';
import { PointSection } from '@/market/sections/PointSection';
import { PaymentMethodSection } from '@/market/sections/PaymentMethodSection';
import type { PaymentMethodRef } from '@/market/sections/PaymentMethodSection';
import { SummarySection } from '@/market/sections/SummarySection';
import { TermsSection } from '@/market/sections/TermsSection';
import { RecentOrdersSection } from '@/market/sections/RecentOrdersSection';
import '@/market/market.css';
import { AddressSection } from './sections/AddressSection';
import { getPriceText } from '@/utils.ts';
import { CheckoutCompletePage } from '@/market/CheckoutCompletePage.tsx';
import { useCheckout } from './hooks/useCheckout';
import type { Address } from '@/market/types/address.types';

export function CheckoutPage() {
  const member = MEMBER;
  const cart = CART;

  const [agreed, setAgreed] = useState<boolean>(false);
  const [placed, setPlaced] = useState<boolean>(false);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);

  const memoRef = useRef<DeliveryMemoRef>(null);
  const paymentRef = useRef<PaymentMethodRef>(null);

  const isRemoteAddress = selectedAddress?.isRemote ?? false;

  const {
    itemTotal,
    shippingFee,
    gradeDiscount,
    gradeDiscountItemTotal,
    selectedCoupon,
    pointDiscount,
    finalPrice,
    setSelectedCoupon,
    setPointDiscount,
  } = useCheckout(cart, member, isRemoteAddress);

  const handlePlace = () => {
    //결제하기 버튼 클릭시 주문 정보 가져오기
    const _orderData = {
      address: selectedAddress,
      memo: memoRef.current?.getValue() ?? '',
      payment: paymentRef.current?.getValue() ?? 'card',
      finalPrice,
    };
    setPlaced(true);
    console.log(_orderData);
  };

  const handleGoBack = () => {
    setSelectedCoupon(null);
    setPointDiscount(0);
    setAgreed(false);
    setSelectedAddress(null);
    setPlaced(false);
  };

  if (placed) {
    return <CheckoutCompletePage finalPrice={finalPrice} goToCheckoutPage={handleGoBack} />;
  }

  return (
    // placed를 key로 넘겨 리마운트 처리
    <div className="checkout" key={`checkout_${placed}`}>
      <h1>주문/결제</h1>

      <AddressSection selectedAddress={selectedAddress} onAddressChange={setSelectedAddress} />

      <DeliveryMemoSection ref={memoRef} />

      <CartSection items={cart} />

      <CouponSection onCouponChange={setSelectedCoupon} />

      <PointSection
        availablePoint={member.point}
        payableAmount={gradeDiscountItemTotal - (selectedCoupon?.discount ?? 0)}
        onPointDiscountChange={setPointDiscount}
      />

      <PaymentMethodSection ref={paymentRef} />

      <SummarySection
        itemTotal={itemTotal}
        shippingFee={shippingFee}
        selectedCoupon={selectedCoupon}
        pointDiscount={pointDiscount}
        gradeDiscount={gradeDiscount}
        finalPrice={finalPrice}
      />

      <TermsSection agreed={agreed} onAgreedChange={setAgreed} />

      <button className="pay" disabled={!agreed} onClick={handlePlace}>
        {getPriceText(finalPrice)} 결제하기
      </button>

      <RecentOrdersSection orders={PAST_ORDERS} />
    </div>
  );
}
