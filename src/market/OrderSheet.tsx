import { useState } from 'react';
import type { Coupon, PaymentMethod } from './types';
import { ADDRESSES, CART, MEMBER } from './data';
import { calcFinalPrice } from './pricing';
import { DeliveryAddressSection } from './DeliveryAddressSection';
import { DeliveryMemoSection } from './DeliveryMemoSection';
import { CartSection } from './CartSection';
import { CouponSection } from './CouponSection';
import { PointSection } from './PointSection';
import { PaymentMethodSection } from './PaymentMethodSection';
import { OrderSummarySection } from './OrderSummarySection';
import { TermsSection } from './TermsSection';
import { RecentOrdersSection } from './RecentOrdersSection';

// AI 생성 코드 - 컴포넌트 props
interface OrderSheetProps {
  onPlace: (finalPrice: number) => void;
}

// AI 생성 코드 - 컴포넌트명
export function OrderSheet({ onPlace }: OrderSheetProps) {
  const [selectedAddressId, setSelectedAddressId] = useState(ADDRESSES[0].id);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [usePoint, setUsePoint] = useState(false);
  const [pointInput, setPointInput] = useState(0);
  const [memo, setMemo] = useState('');
  const [payment, setPayment] = useState<PaymentMethod>('card');
  const [agreed, setAgreed] = useState(false);

  const address = ADDRESSES.find((a) => a.id === selectedAddressId);
  const effectivePointInput = usePoint ? pointInput : 0;

  const { itemTotal, shippingFee, pointDiscount, finalPrice } = calcFinalPrice({
    cart: CART,
    address,
    coupon: appliedCoupon,
    pointInput: effectivePointInput,
    member: MEMBER
  });

  return (
    <div className="checkout">
      <h1>주문/결제</h1>
      <DeliveryAddressSection selectedAddressId={selectedAddressId} onSelectAddress={setSelectedAddressId} />
      <DeliveryMemoSection memo={memo} onChangeMemo={setMemo} />
      <CartSection />
      <CouponSection appliedCoupon={appliedCoupon} onApply={setAppliedCoupon} />
      <PointSection usePoint={usePoint} pointInput={pointInput} onChangeUsePoint={setUsePoint} onChangePointInput={setPointInput} />
      <PaymentMethodSection payment={payment} onChangePayment={setPayment} />
      <OrderSummarySection itemTotal={itemTotal} shippingFee={shippingFee} appliedCoupon={appliedCoupon} pointDiscount={pointDiscount} finalPrice={finalPrice} />
      <TermsSection agreed={agreed} onChangeAgreed={setAgreed} />
      <button className="pay" disabled={!agreed} onClick={() => onPlace(finalPrice)}>
        {finalPrice.toLocaleString()}원 결제하기
      </button>
      <RecentOrdersSection />
    </div>
  );
}
