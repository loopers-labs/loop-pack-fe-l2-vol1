import type { CartItem, Coupon } from "./types";

export const calculateItemTotal = (cartItems: CartItem[]) =>
  cartItems.reduce((sum, it) => sum + it.price * it.quantity, 0);

export const calculateShippingFee = (totalItemAmount: number, isAddressRemote: boolean) => {
  let shippingFee = 3000;
  if (totalItemAmount >= 50000) {
    shippingFee = 0;
  }
  if (isAddressRemote) {
    shippingFee += 3000;
  }
  return shippingFee;
};

export const calculateCouponDiscount = (appliedCoupon: Coupon | null) => {
  return appliedCoupon ? appliedCoupon.discount : 0;
};

export const calculatePointDiscount = (
  isUsingPoint: boolean,
  pointDetail: { pointInput: number; memberTotalPoint: number; totalItemAmount: number },
) => {
  const { pointInput, memberTotalPoint, totalItemAmount } = pointDetail;
  return isUsingPoint ? Math.min(pointInput, memberTotalPoint, totalItemAmount) : 0;
};

export const calculateFinalPrice = ({
  itemTotal,
  shippingFee,
  couponDiscount,
  pointDiscount,
}: {
  itemTotal: number;
  shippingFee: number;
  couponDiscount: number;
  pointDiscount: number;
}) => {
  return itemTotal + shippingFee - couponDiscount - pointDiscount;
};
