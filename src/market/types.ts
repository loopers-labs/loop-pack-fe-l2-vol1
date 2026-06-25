export type CartItem = {
  id: string;
  name: string;
  option: string; // 예: "차콜 / M"
  price: number;
  quantity: number;
  thumbnail: string; // 이모지
};

export type Coupon = {
  code: string;
  label: string;
  discount: number; // 정액 할인(원)
};

export type Address = {
  id: string;
  label: string; // "집", "회사"
  recipient: string;
  detail: string;
  isRemote: boolean; // 도서산간 → 배송비 추가
};

export const PAYMENT_METHODS = ['card', 'transfer', 'kakao'] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];
export const PAYMENT_LABEL: Record<PaymentMethod, string> = {
  card: '신용/체크카드',
  transfer: '계좌이체',
  kakao: '카카오페이',
};

export type Member = {
  name: string;
  grade: 'VIP' | 'NORMAL';
  point: number; // 보유 적립금
};

export type OrderStatus =
  | 'paid'
  | 'preparing'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export type PastOrder = {
  id: string;
  summary: string;
  status: OrderStatus;
  amount: number;
};

export type CheckoutState = {
  addressId: string;
  deliveryMemo: string;
  appliedCoupon: Coupon | null;
  pointInput: number;
  paymentMethod: PaymentMethod;
  agreed: boolean;
};
