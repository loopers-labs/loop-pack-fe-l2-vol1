import { useState } from 'react';
import type { Coupon } from './types';
import { COUPONS } from './data';

interface CouponSectionProps {
  appliedCoupon: Coupon | null;
  onApply: (coupon: Coupon | null) => void;
}

export function CouponSection({ appliedCoupon, onApply }: CouponSectionProps) {
  const [couponCode, setCouponCode] = useState('');

  const handleApply = () => {
    const found = COUPONS.find((c) => c.code === couponCode.trim());
    onApply(found ?? null);
    if (!found) alert('존재하지 않는 쿠폰이에요');
  };

  return (
    <div className="section">
      <h2>쿠폰</h2>
      <div className="row">
        <input type="text" value={couponCode} onChange={(e) => setCouponCode(e.target.value)} placeholder="쿠폰 코드 (예: WELCOME5000)" />
        <button onClick={handleApply}>적용</button>
      </div>
      {appliedCoupon ? <small>{appliedCoupon.label} 적용됨</small> : null}
    </div>
  );
}
