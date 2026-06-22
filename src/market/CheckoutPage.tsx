import { useReducer, useState } from 'react';
import type { Dispatch } from 'react';

import { CouponSection } from './CouponSection';
import { DeliveryAddress } from './DeliveryAddress';
import { DeliveryMemo } from './DeliveryMemo';
import { OrderComplete } from './OrderComplete';
import { OrderItemList } from './OrderItemList';
import { PayButton } from './PayButton';
import { PaymentMethodSection } from './PaymentMethodSection';
import { PointSection } from './PointSection';
import { PriceSummary } from './PriceSummary';
import { RecentOrders } from './RecentOrders';
import { TermsAgreement } from './TermsAgreement';
import { checkoutReducer, initialCheckoutState } from './checkoutReducer';
import type { CheckoutAction, CheckoutState } from './checkoutReducer';
import { ADDRESSES, CART, COUPONS, MEMBER } from './data';
import type { PaymentMethod } from './types';
import { useOrderAmount } from './useOrderAmount';
import './market.css';

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
      <DeliveryMemo memo={state.deliveryMemo} onChangeMemo={setMemo} />
      <OrderItemList items={CART} />
      <CouponSection
        appliedCoupon={state.appliedCoupon}
        onApplyCoupon={handleApplyCoupon}
      />
      <PointSection
        usePoint={state.usePoint}
        pointInput={state.pointInput}
        availablePoint={member.point}
        onToggleUse={setUsePoint}
        onChangePointInput={setPointInput}
      />
      <PaymentMethodSection
        paymentMethod={state.paymentMethod}
        onChangePaymentMethod={setPaymentMethod}
      />
      <PriceSummary
        amount={amount}
        appliedCoupon={state.appliedCoupon}
        usePoint={state.usePoint}
        member={member}
      />
      <TermsAgreement agreed={state.agreed} onChangeAgreed={setAgreed} />
      <PayButton
        finalPrice={amount.finalPrice}
        disabled={!state.agreed}
        onClick={onPlace}
      />
      <RecentOrders />
    </div>
  );
}
