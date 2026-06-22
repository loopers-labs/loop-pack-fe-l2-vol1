import { useState } from 'react';

import type { Coupon } from './types';

type Props = {
  appliedCoupon: Coupon | null;
  onApplyCoupon: (code: string) => void;
};

export function CouponSection({ appliedCoupon, onApplyCoupon }: Props) {
  const [couponCode, setCouponCode] = useState('');
  return (
    <>
      <div className="row">
        <input
          type="text"
          value={couponCode}
          onChange={(e) => setCouponCode(e.target.value)}
          placeholder="쿠폰 코드 (예: WELCOME5000)"
        />
        <button onClick={() => onApplyCoupon(couponCode)}>적용</button>
      </div>
      {appliedCoupon ? <small>{appliedCoupon.label} 적용됨</small> : null}
    </>
  );
}
