import { Show } from '@ilokesto/utilinent'
import { useState } from 'react'

import { type Coupon, OrderLine } from '@/entities/market'
import { Button, FieldError, Input } from '@/shared/ui'

type ApplyCouponFormProps = {
  coupons: Array<Coupon>
  appliedCoupon: Coupon | null
  onApplyCoupon: (coupon: Coupon | null) => void
}

export function ApplyCouponForm({
  coupons,
  appliedCoupon,
  onApplyCoupon,
}: ApplyCouponFormProps) {
  const [couponCode, setCouponCode] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const handleApplyCoupon = () => {
    const normalizedCouponCode = couponCode.trim()
    const foundCoupon =
      coupons.find((coupon) => coupon.code === normalizedCouponCode) ?? null

    onApplyCoupon(foundCoupon)
    setErrorMessage(foundCoupon ? '' : '존재하지 않는 쿠폰이에요')
  }

  return (
    <>
      <div className="flex gap-2">
        <Input
          aria-label="쿠폰 코드"
          type="text"
          value={couponCode}
          onChange={(e) => {
            setCouponCode(e.target.value)
          }}
          placeholder="쿠폰 코드 (예: WELCOME5000)"
        />
        <Button type="button" onClick={handleApplyCoupon}>
          적용
        </Button>
      </div>
      <Show when={appliedCoupon}>
        {(coupon) => (
          <OrderLine.Description>{coupon.label} 적용됨</OrderLine.Description>
        )}
      </Show>
      <Show when={errorMessage}>
        {(message) => <FieldError>{message}</FieldError>}
      </Show>
    </>
  )
}
