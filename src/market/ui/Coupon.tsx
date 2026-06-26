import type { Coupon as CouponType } from '../shared/types/types';
import { SectionContainer } from '../shared/ui/container';

export const Coupon = ({
  couponCode,
  appliedCoupon,
  onInputChange,
  onApplyButtonClick,
}: {
  couponCode: string;
  appliedCoupon: CouponType | null;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onApplyButtonClick: () => void;
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
