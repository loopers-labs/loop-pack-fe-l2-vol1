import { useState } from 'react';

import { COUPONS } from './data';
import type { Coupon } from './types';

type Props = {
  appliedCoupon: Coupon | null;
  onApplyCoupon: (coupon: Coupon | null) => void;
};

export function CouponSection({ appliedCoupon, onApplyCoupon }: Props) {
  const [couponCode, setCouponCode] = useState('');

  const handleApply = () => {
    const found = COUPONS.find((c) => c.code === couponCode.trim()) ?? null;
    if (!found) alert('존재하지 않는 쿠폰이에요');
    onApplyCoupon(found);
  };

  return (
    <>
      <div className="row">
        <input
          type="text"
          value={couponCode}
          onChange={(e) => setCouponCode(e.target.value)}
          placeholder="쿠폰 코드 (예: WELCOME5000)"
        />
        <button onClick={handleApply}>적용</button>
      </div>
      {appliedCoupon ? <small>{appliedCoupon.label} 적용됨</small> : null}
    </>
  );
}
