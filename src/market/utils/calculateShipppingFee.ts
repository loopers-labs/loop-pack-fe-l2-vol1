import {
  BASE_SHIPPING_FEE,
  FREE_SHIPPING_THRESHOLD,
  REMOTE_AREA_SURCHARGE,
} from '../shared/constants/shipping';

// 배송비 관련 금액들을 상수로 지정
export const calculateShippingFee = (itemTotal: number, isRemote: boolean): number => {
  let shippingFee = BASE_SHIPPING_FEE;
  if (itemTotal >= FREE_SHIPPING_THRESHOLD) shippingFee = 0;
  if (isRemote) shippingFee += REMOTE_AREA_SURCHARGE;
  return shippingFee;
};
