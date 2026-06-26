import { useState } from 'react';
import { ADDRESSES, CART, COUPONS, MEMBER } from './data';
import './market.css';
import type { Coupon, PaymentMethod } from './types';

const FREE_SHIPPING_THRESHOLD = 50000;
const BASE_SHIPPING_FEE = 3000;
const REMOTE_AREA_SURCHARGE = 3000;
const VIP_DISCOUNT_RATE = 0.9;

export function useCheckout() {
  const member = MEMBER;
  const cart = CART;

  const [selectedAddressId, setSelectedAddressId] = useState(ADDRESSES[0].id);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [usePoint, setUsePoint] = useState(false);
  const [pointInput, setPointInput] = useState(0);
  const [payment, setPayment] = useState<PaymentMethod>('card');
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [placed, setPlaced] = useState(false);
  const [memo, setMemo] = useState('');

  const address = ADDRESSES.find((a) => a.id === selectedAddressId)!;

  // ── 배송비 정책 ──────────────────────────────
  const itemTotal = cart.reduce((sum, it) => sum + it.price * it.quantity, 0);
  let shippingFee = BASE_SHIPPING_FEE;
  if (itemTotal >= FREE_SHIPPING_THRESHOLD) shippingFee = 0;
  if (address.isRemote) shippingFee += REMOTE_AREA_SURCHARGE;

  // ── 쿠폰 정책 ────────────────────────────────
  const couponDiscount = appliedCoupon ? appliedCoupon.discount : 0;

  // ── 적립금 정책 ──────────────────────────────
  const pointDiscount = usePoint
    ? Math.min(pointInput, member.point, itemTotal)
    : 0;

  // 최종 결제 금액 , VIP 할인 적용
  const basePrice = itemTotal + shippingFee - couponDiscount - pointDiscount;
  const finalPrice =
    member.grade === 'VIP'
      ? Math.round(basePrice * VIP_DISCOUNT_RATE)
      : basePrice;

  const applyCoupon = () => {
    const found = COUPONS.find((c) => c.code === couponCode.trim());
    setAppliedCoupon(found ?? null);
    if (!found) alert('존재하지 않는 쿠폰이에요');
  };

  const handleSubmit = () => {
    // TODO: API 연결 시 여기서 주문 데이터 수집 후 전송
    // const orderData = {
    //   addressId: selectedAddressId,
    //   memo,
    //   coupon: appliedCoupon,
    //   pointDiscount,
    //   payment,
    //   cart,
    //   finalPrice,
    // };
    setPlaced(true);
  };

  return {
    member,
    cart,
    selectedAddressId,
    couponCode,
    appliedCoupon,
    usePoint,
    pointInput,
    payment,
    isTermsOpen,
    agreed,
    placed,
    memo,
    setSelectedAddressId,
    setCouponCode,
    setUsePoint,
    setPointInput,
    setPayment,
    setIsTermsOpen,
    setAgreed,
    setMemo,
    setPlaced,
    itemTotal,
    shippingFee,
    couponDiscount,
    pointDiscount,
    basePrice,
    finalPrice,
    applyCoupon,
    handleSubmit,
  };
}
