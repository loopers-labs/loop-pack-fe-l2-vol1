import { useState } from 'react';

import { CouponSection } from './CouponSection';
import { DeliveryAddress } from './DeliveryAddress';
import { DeliveryMemo } from './DeliveryMemo';
import { OrderComplete } from './OrderComplete';
import { OrderLineRow } from './OrderLineRow';
import { PastOrderRow } from './PastOrderRow';
import { PayButton } from './PayButton';
import { PaymentMethodOption } from './PaymentMethodOption';
import { PointSection } from './PointSection';
import { PriceSummary } from './PriceSummary';
import { SectionCard } from './SectionCard';
import { TermsAgreement } from './TermsAgreement';
import { ADDRESSES, CART, PAST_ORDERS } from './data';
import { PAYMENT_METHODS } from './types';
import type { CheckoutState, Coupon, PaymentMethod } from './types';
import { useOrderAmount } from './useOrderAmount';
import './market.css';

export function CheckoutPage() {
  const [checkoutForm, setCheckoutForm] = useState<CheckoutState>({
    addressId: ADDRESSES[0].id,
    deliveryMemo: '',
    appliedCoupon: null,
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
  const setPointInput = (amount: number) => update({ pointInput: amount });
  const setPaymentMethod = (method: PaymentMethod) =>
    update({ paymentMethod: method });
  const setAgreed = (agreed: boolean) => update({ agreed });
  const setAppliedCoupon = (coupon: Coupon | null) =>
    update({ appliedCoupon: coupon });

  return (
    <div className="checkout">
      <h1>주문/결제</h1>

      <DeliveryAddress
        addressId={checkoutForm.addressId}
        onChangeAddress={setAddress}
      />

      <SectionCard title="배송 요청사항">
        <DeliveryMemo memo={checkoutForm.deliveryMemo} onChangeMemo={setMemo} />
      </SectionCard>

      <SectionCard title="주문 상품">
        {CART.map((item) => (
          <OrderLineRow key={item.id}>
            <OrderLineRow.Product item={item} />
            <OrderLineRow.Amount amount={item.price * item.quantity} />
          </OrderLineRow>
        ))}
      </SectionCard>

      <SectionCard title="쿠폰">
        <CouponSection
          appliedCoupon={checkoutForm.appliedCoupon}
          onApplyCoupon={setAppliedCoupon}
        />
      </SectionCard>

      <SectionCard title="적립금">
        <PointSection
          pointInput={checkoutForm.pointInput}
          onChangePointInput={setPointInput}
        />
      </SectionCard>

      <SectionCard title="결제수단">
        {PAYMENT_METHODS.map((method) => (
          <PaymentMethodOption
            key={method}
            method={method}
            checked={checkoutForm.paymentMethod === method}
            onSelect={setPaymentMethod}
          />
        ))}
      </SectionCard>

      <SectionCard title="결제 금액">
        <PriceSummary
          amount={amount}
          appliedCoupon={checkoutForm.appliedCoupon}
        />
      </SectionCard>

      <TermsAgreement agreed={checkoutForm.agreed} onChangeAgreed={setAgreed} />

      <PayButton
        finalPrice={amount.finalPrice}
        disabled={!checkoutForm.agreed}
        onClick={onPlace}
      />

      <SectionCard title="최근 주문">
        {PAST_ORDERS.map((order) => (
          <PastOrderRow key={order.id} order={order} />
        ))}
      </SectionCard>
    </div>
  );
}
