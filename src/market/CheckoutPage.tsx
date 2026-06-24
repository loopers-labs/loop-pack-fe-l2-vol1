import { useState } from 'react';

import { CouponSection } from './CouponSection';
import { DeliveryAddress } from './DeliveryAddress';
import { OrderComplete } from './OrderComplete';
import { OrderLineRow } from './OrderLineRow';
import { PastOrderRow } from './PastOrderRow';
import { PriceSummary } from './PriceSummary';
import { SectionCard } from './SectionCard';
import { TermsAgreement } from './TermsAgreement';
import { ADDRESSES, CART, COUPONS, MEMBER, PAST_ORDERS } from './data';
import type { CheckoutState, PaymentMethod } from './types';
import { useOrderAmount } from './useOrderAmount';
import './market.css';

const PAYMENT_LABEL: Record<PaymentMethod, string> = {
  card: '신용/체크카드',
  transfer: '계좌이체',
  kakao: '카카오페이',
};

export function CheckoutPage() {
  const [checkoutForm, setCheckoutForm] = useState<CheckoutState>({
    addressId: ADDRESSES[0].id,
    deliveryMemo: '',
    appliedCoupon: null,
    usePoint: false,
    pointInput: 0,
    paymentMethod: 'card',
    agreed: false,
  });
  const [placed, setPlaced] = useState(false);

  const update = (patch: Partial<CheckoutState>) =>
    setCheckoutForm((prev) => ({ ...prev, ...patch }));

  const amount = useOrderAmount(checkoutForm);

  if (placed) {
    return (
      <OrderComplete
        finalPrice={amount.finalPrice}
        onBack={() => setPlaced(false)}
      />
    );
  }

  return (
    <CheckoutForm
      checkoutForm={checkoutForm}
      update={update}
      amount={amount}
      onPlace={() => setPlaced(true)}
    />
  );
}

type FormProps = {
  checkoutForm: CheckoutState;
  update: (patch: Partial<CheckoutState>) => void;
  amount: ReturnType<typeof useOrderAmount>;
  onPlace: () => void;
};

function CheckoutForm({ checkoutForm, update, amount, onPlace }: FormProps) {
  const setAddress = (id: string) => update({ addressId: id });
  const setMemo = (memo: string) => update({ deliveryMemo: memo });
  const setUsePoint = (use: boolean) => update({ usePoint: use });
  const setPointInput = (amount: number) => update({ pointInput: amount });
  const setPaymentMethod = (method: PaymentMethod) =>
    update({ paymentMethod: method });
  const setAgreed = (agreed: boolean) => update({ agreed });

  // 쿠폰 조회 + alert 는 상태 업데이트 밖(호출부)에서, 결과만 반영.
  const handleApplyCoupon = (code: string) => {
    const found = COUPONS.find((c) => c.code === code.trim());
    update({ appliedCoupon: found ?? null });
    if (!found) alert('존재하지 않는 쿠폰이에요');
  };

  return (
    <div className="checkout">
      <h1>주문/결제</h1>

      <DeliveryAddress
        addressId={checkoutForm.addressId}
        onChangeAddress={setAddress}
      />

      <SectionCard title="배송 요청사항">
        <textarea
          value={checkoutForm.deliveryMemo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="배송 시 요청사항 (예: 부재 시 문 앞에 두세요)"
        />
      </SectionCard>

      <SectionCard title="주문 상품">
        {CART.map((it) => (
          <OrderLineRow
            key={it.id}
            type="product"
            label={it.name}
            amount={it.price * it.quantity}
            thumbnail={it.thumbnail}
            option={it.option}
            quantity={it.quantity}
          />
        ))}
      </SectionCard>

      <SectionCard title="쿠폰">
        <CouponSection
          appliedCoupon={checkoutForm.appliedCoupon}
          onApplyCoupon={handleApplyCoupon}
        />
      </SectionCard>

      <SectionCard title="적립금">
        <label>
          <input
            type="checkbox"
            checked={checkoutForm.usePoint}
            onChange={(e) => setUsePoint(e.target.checked)}
          />
          적립금 사용 (보유 {MEMBER.point.toLocaleString()}P)
        </label>
        {checkoutForm.usePoint ? (
          <input
            type="number"
            value={checkoutForm.pointInput}
            onChange={(e) => setPointInput(Number(e.target.value))}
          />
        ) : null}
      </SectionCard>

      <SectionCard title="결제수단">
        {(['card', 'transfer', 'kakao'] as PaymentMethod[]).map((m) => (
          <label key={m}>
            <input
              type="radio"
              checked={checkoutForm.paymentMethod === m}
              onChange={() => setPaymentMethod(m)}
            />
            {PAYMENT_LABEL[m]}
          </label>
        ))}
      </SectionCard>

      <SectionCard title="결제 금액">
        <PriceSummary
          amount={amount}
          appliedCoupon={checkoutForm.appliedCoupon}
          usePoint={checkoutForm.usePoint}
        />
      </SectionCard>

      <TermsAgreement agreed={checkoutForm.agreed} onChangeAgreed={setAgreed} />

      <button className="pay" disabled={!checkoutForm.agreed} onClick={onPlace}>
        {amount.finalPrice.toLocaleString()}원 결제하기
      </button>

      <SectionCard title="최근 주문">
        {PAST_ORDERS.map((order) => (
          <PastOrderRow key={order.id} order={order} />
        ))}
      </SectionCard>
    </div>
  );
}
