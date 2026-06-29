import { type Coupon, marketService } from '@/entities/market'
import { ApplyCouponForm } from '@/features/market'
import { Heading, SectionCard } from '@/shared/ui'

export function CouponCodeSection({
  appliedCoupon,
  onAppliedCoupon,
}: {
  appliedCoupon: Coupon | null
  onAppliedCoupon: (coupon: Coupon | null) => void
}) {
  const coupons = marketService.getCoupons()

  return (
    <SectionCard>
      <Heading.H2>쿠폰</Heading.H2>
      <ApplyCouponForm
        coupons={coupons}
        appliedCoupon={appliedCoupon}
        onApplyCoupon={onAppliedCoupon}
      />
    </SectionCard>
  )
}
