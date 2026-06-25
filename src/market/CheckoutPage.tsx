import { useState } from 'react';
import { CART, MEMBER, PAST_ORDERS } from '@/market/data';
import { DeliveryMemoSection } from '@/market/sections/DeliveryMemoSection';
import { CartSection } from '@/market/sections/CartSection';
import { CouponSection } from '@/market/sections/CouponSection';
import { PointSection } from '@/market/sections/PointSection';
import { PaymentMethodSection } from '@/market/sections/PaymentMethodSection';
import { SummarySection } from '@/market/sections/SummarySection';
import { TermsSection } from '@/market/sections/TermsSection';
import { RecentOrdersSection } from '@/market/sections/RecentOrdersSection';
import '@/market/market.css';
import { AddressSection } from '@/market/sections/AddressSection';
import { getPriceText } from '@/utils.ts';
import {
  VIP_DISCOUNT_RATE,
  BASE_SHIPPING_FEE,
  FREE_SHIPPING_THRESHOLD,
  REMOTE_AREA_SURCHARGE,
} from '@/market/pricePolicy.ts';
import { CheckoutCompletePage } from '@/market/CheckoutCompletePage.tsx';

export function CheckoutPage() {
  const member = MEMBER;
  const cart = CART;

  const [couponDiscount, setCouponDiscount] = useState<number>(0); //쿠폰
  const [pointDiscount, setPointDiscount] = useState<number>(0); //포인트
  const [agreed, setAgreed] = useState<boolean>(false); //약관 동의 여부
  const [isRemoteAddress, setIsRemoteAddress] = useState(false); //도서산간 여부

  //결제하기 버튼 클릭 flag
  const [placed, setPlaced] = useState<boolean>(false);

  // ── 배송비 정책 ──────────────────────────────
  const itemTotal = cart.reduce((sum, it) => sum + it.price * it.quantity, 0);
  let shippingFee = BASE_SHIPPING_FEE;
  if (itemTotal >= FREE_SHIPPING_THRESHOLD) shippingFee = 0;
  if (isRemoteAddress) shippingFee += REMOTE_AREA_SURCHARGE;

  // ── 등급 할인 정책 ──────────────────────────
  const gradeDiscountItemTotal =
    member.grade === 'VIP' ? Math.round(itemTotal * VIP_DISCOUNT_RATE) : itemTotal;
  const gradeDiscount = itemTotal - gradeDiscountItemTotal;

  const finalPrice = gradeDiscountItemTotal + shippingFee - couponDiscount - pointDiscount;

  if (placed) {
    return (
      <CheckoutCompletePage finalPrice={finalPrice} goToCheckoutPage={() => setPlaced(false)} />
    );
  }

  return (
    <div className="checkout">
      <h1>주문/결제</h1>

      <AddressSection onRemoteChange={setIsRemoteAddress} />

      <DeliveryMemoSection />

      <CartSection items={cart} />

      <CouponSection onDiscountChange={setCouponDiscount} />

      <PointSection
        availablePoint={member.point}
        itemTotal={gradeDiscountItemTotal}
        onPointDiscountChange={setPointDiscount}
      />

      <PaymentMethodSection />

      <SummarySection
        itemTotal={itemTotal}
        shippingFee={shippingFee}
        couponDiscount={couponDiscount}
        pointDiscount={pointDiscount}
        gradeDiscount={gradeDiscount}
        finalPrice={finalPrice}
      />

      <TermsSection agreed={agreed} onAgreedChange={setAgreed} />

      <button className="pay" disabled={!agreed} onClick={() => setPlaced(true)}>
        {getPriceText(finalPrice)} 결제하기
      </button>

      <RecentOrdersSection orders={PAST_ORDERS} />
    </div>
  );
}
