import type { Coupon } from '../types';
import { SectionContainer } from './container';

export const CouponSection = ({
  couponCode,
  onInputChange,
  onApplyButtonClick,
  appliedCoupon,
}: {
  couponCode: string;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void; // handleCouponCode라는 이름이 적절한가?
  onApplyButtonClick: () => void;
  appliedCoupon: Coupon | null;
}) => {
  return (
    <SectionContainer title="쿠폰">
      <div className="row">
        <input
          type="text"
          value={couponCode}
          onChange={onInputChange}
          placeholder="쿠폰 코드 (예: WELCOME5000)"
        />
        <button onClick={onApplyButtonClick}>적용</button>
      </div>
      {appliedCoupon ? <small>{appliedCoupon.label} 적용됨</small> : null}
    </SectionContainer>
  );
};
