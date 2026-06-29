import type { Member } from "./types";

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

export const calculatePointDiscount = (
  isUsingPoint: boolean,
  pointDetail: { pointInput: number; memberTotalPoint: number; totalItemAmount: number },
) => {
  const { pointInput, memberTotalPoint, totalItemAmount } = pointDetail;
  const availablePointInput = Math.max(pointInput, 0);
  return isUsingPoint ? Math.min(availablePointInput, memberTotalPoint, totalItemAmount) : 0;
};

export const calculateFinalPrice = ({
  itemTotal,
  shippingFee,
  couponDiscount,
  pointDiscount,
  memberGrade,
}: {
  itemTotal: number;
  shippingFee: number;
  couponDiscount: number;
  pointDiscount: number;
  memberGrade: Member["grade"];
}) => {
  const membershipDiscount = memberGrade === "VIP" ? Math.round(itemTotal * 0.1) : 0;
  return itemTotal - membershipDiscount + shippingFee - couponDiscount - pointDiscount;
};
