import { useReducer, useState } from 'react';
import type { Dispatch } from 'react';

import { CouponSection } from './CouponSection';
import { DeliveryAddress } from './DeliveryAddress';
import { OrderComplete } from './OrderComplete';
import { OrderLineRow } from './OrderLineRow';
import { OrderStatusTag } from './OrderStatusTag';
import { PriceSummary } from './PriceSummary';
import { SectionCard } from './SectionCard';
import { TermsAgreement } from './TermsAgreement';
import { checkoutReducer, initialCheckoutState } from './checkoutReducer';
import type { CheckoutAction, CheckoutState } from './checkoutReducer';
import { ADDRESSES, CART, COUPONS, MEMBER, PAST_ORDERS } from './data';
import type { PaymentMethod } from './types';
import { useOrderAmount } from './useOrderAmount';
import './market.css';

const PAYMENT_LABEL: Record<PaymentMethod, string> = {
  card: '신용/체크카드',
  transfer: '계좌이체',
  kakao: '카카오페이',
};

export function CheckoutPage() {
  const [state, dispatch] = useReducer(
    checkoutReducer,
    ADDRESSES[0].id,
    initialCheckoutState,
  );
  const [placed, setPlaced] = useState(false);
  const amount = useOrderAmount(state);

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
      state={state}
      dispatch={dispatch}
      amount={amount}
      onPlace={() => setPlaced(true)}
    />
  );
}

type FormProps = {
  state: CheckoutState;
  dispatch: Dispatch<CheckoutAction>;
  amount: ReturnType<typeof useOrderAmount>;
  onPlace: () => void;
};

function CheckoutForm({ state, dispatch, amount, onPlace }: FormProps) {
  const member = MEMBER;

  const setAddress = (id: string) =>
    dispatch({ type: 'setAddress', addressId: id });
  const setMemo = (memo: string) => dispatch({ type: 'setMemo', memo });
  const setUsePoint = (use: boolean) =>
    dispatch({ type: 'toggleUsePoint', use });
  const setPointInput = (amount: number) =>
    dispatch({ type: 'setPointInput', amount });
  const setPaymentMethod = (method: PaymentMethod) =>
    dispatch({ type: 'setPaymentMethod', method });
  const setAgreed = (agreed: boolean) =>
    dispatch({ type: 'setAgreed', agreed });

  // 쿠폰 조회 + alert 는 순수 reducer 밖(호출부)에서, 결과만 dispatch.
  const handleApplyCoupon = (code: string) => {
    const found = COUPONS.find((c) => c.code === code.trim());
    dispatch({ type: 'applyCoupon', coupon: found ?? null });
    if (!found) alert('존재하지 않는 쿠폰이에요');
  };

  return (
    <div className="checkout">
      <h1>주문/결제</h1>

      <DeliveryAddress
        addressId={state.addressId}
        onChangeAddress={setAddress}
      />

      <SectionCard title="배송 요청사항">
        <textarea
          value={state.deliveryMemo}
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
          appliedCoupon={state.appliedCoupon}
          onApplyCoupon={handleApplyCoupon}
        />
      </SectionCard>

      <SectionCard title="적립금">
        <label>
          <input
            type="checkbox"
            checked={state.usePoint}
            onChange={(e) => setUsePoint(e.target.checked)}
          />
          적립금 사용 (보유 {member.point.toLocaleString()}P)
        </label>
        {state.usePoint ? (
          <input
            type="number"
            value={state.pointInput}
            onChange={(e) => setPointInput(Number(e.target.value))}
          />
        ) : null}
      </SectionCard>

      <SectionCard title="결제수단">
        {(['card', 'transfer', 'kakao'] as PaymentMethod[]).map((m) => (
          <label key={m}>
            <input
              type="radio"
              checked={state.paymentMethod === m}
              onChange={() => setPaymentMethod(m)}
            />
            {PAYMENT_LABEL[m]}
          </label>
        ))}
      </SectionCard>

      <SectionCard title="결제 금액">
        <PriceSummary
          amount={amount}
          appliedCoupon={state.appliedCoupon}
          usePoint={state.usePoint}
          member={member}
        />
      </SectionCard>

      <TermsAgreement agreed={state.agreed} onChangeAgreed={setAgreed} />

      <button className="pay" disabled={!state.agreed} onClick={onPlace}>
        {amount.finalPrice.toLocaleString()}원 결제하기
      </button>

      <SectionCard title="최근 주문">
        {PAST_ORDERS.map((o) => (
          <div key={o.id} className="line">
            <div className="grow">{o.summary}</div>
            <OrderStatusTag
              isPaid={o.status === 'paid'}
              isPreparing={o.status === 'preparing'}
              isShipped={o.status === 'shipped'}
              isDelivered={o.status === 'delivered'}
              isCancelled={o.status === 'cancelled'}
            />
          </div>
        ))}
      </SectionCard>
    </div>
  );
}
