import type { Coupon, PaymentMethod } from './types';

export type CheckoutState = {
  addressId: string;
  deliveryMemo: string;
  appliedCoupon: Coupon | null;
  usePoint: boolean;
  pointInput: number;
  paymentMethod: PaymentMethod;
  agreed: boolean;
};

export type CheckoutAction =
  | { type: 'setAddress'; addressId: string }
  | { type: 'setMemo'; memo: string }
  | { type: 'applyCoupon'; coupon: Coupon | null }
  | { type: 'toggleUsePoint'; use: boolean }
  | { type: 'setPointInput'; amount: number }
  | { type: 'setPaymentMethod'; method: PaymentMethod }
  | { type: 'setAgreed'; agreed: boolean };

export function checkoutReducer(
  state: CheckoutState,
  action: CheckoutAction,
): CheckoutState {
  switch (action.type) {
    case 'setAddress':
      return { ...state, addressId: action.addressId };
    case 'setMemo':
      return { ...state, deliveryMemo: action.memo };
    case 'applyCoupon':
      return { ...state, appliedCoupon: action.coupon };
    case 'toggleUsePoint':
      return { ...state, usePoint: action.use };
    case 'setPointInput':
      return { ...state, pointInput: action.amount };
    case 'setPaymentMethod':
      return { ...state, paymentMethod: action.method };
    case 'setAgreed':
      return { ...state, agreed: action.agreed };
    default:
      return state;
  }
}

export function initialCheckoutState(addressId: string): CheckoutState {
  return {
    addressId,
    deliveryMemo: '',
    appliedCoupon: null,
    usePoint: false,
    pointInput: 0,
    paymentMethod: 'card',
    agreed: false,
  };
}
