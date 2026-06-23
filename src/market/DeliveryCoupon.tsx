import { useState } from 'react'
import type { Coupon } from './types'

interface CounponProps {
  coupons: Coupon[]
  appliedCoupon: Coupon | null
  setAppliedCoupon: React.Dispatch<React.SetStateAction<Coupon | null>>
}

export function DeliveryCoupon({ coupons, appliedCoupon, setAppliedCoupon }: CounponProps) {
  const [couponCode, setCouponCode] = useState('')
  const applyCoupon = () => {
    const found = coupons.find((c) => c.code === couponCode.trim())
    setAppliedCoupon(found ?? null)
    if (!found) alert('존재하지 않는 쿠폰이에요')
  }

  return (
    <div className="section">
      <h2>쿠폰</h2>
      <div className="row">
        <input
          type="text"
          value={couponCode}
          onChange={(e) => setCouponCode(e.target.value)}
          placeholder="쿠폰 코드 (예: WELCOME5000)"
        />
        <button onClick={applyCoupon}>적용</button>
      </div>
      {appliedCoupon ? <small>{appliedCoupon.label} 적용됨</small> : null}
    </div>
  )
}
