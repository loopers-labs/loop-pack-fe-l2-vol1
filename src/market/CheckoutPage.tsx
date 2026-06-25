import { useState } from 'react';

import { CheckoutForm } from './CheckoutForm';
import { OrderComplete } from './OrderComplete';
import { ADDRESSES } from './data';
import type { CheckoutState } from './types';
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

  if (placed) {
    return (
      <OrderComplete
        checkoutForm={checkoutForm}
        onBack={() => setPlaced(false)}
      />
    );
  }

  return (
    <CheckoutForm
      checkoutForm={checkoutForm}
      update={update}
      onPlace={() => setPlaced(true)}
    />
  );
}
