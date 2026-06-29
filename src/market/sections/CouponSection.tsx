import type { Coupon } from "../types";
import { Section } from "../ui/Section";

type CouponSectionProps = {
  couponCodeInput: string;
  appliedCoupon: Coupon | null;
  onCouponCodeInputChange: (newInput: string) => void;
  onApplyCoupon: () => void;
};

export function CouponSection({
  couponCodeInput,
  appliedCoupon,
  onCouponCodeInputChange,
  onApplyCoupon,
}: CouponSectionProps) {
  return (
    <Section title="쿠폰">
      <div className="row">
        <input
          type="text"
          value={couponCodeInput}
          onChange={(e) => onCouponCodeInputChange(e.target.value)}
          placeholder="쿠폰 코드 (예: WELCOME5000)"
        />
        <button onClick={onApplyCoupon}>적용</button>
      </div>
      {appliedCoupon ? <small>{appliedCoupon.label} 적용됨</small> : null}
    </Section>
  );
}
