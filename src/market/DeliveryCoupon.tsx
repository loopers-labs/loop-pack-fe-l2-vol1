import { useState } from 'react'
import { useCheckout } from './context'

export function DeliveryCoupon() {
  const { coupons, appliedCoupon, setAppliedCoupon } = useCheckout()
  const [couponCode, setCouponCode] = useState('')
  const handleApplyCoupon = () => {
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
        <button onClick={handleApplyCoupon}>적용</button>
      </div>
      {appliedCoupon ? <small>{appliedCoupon.label} 적용됨</small> : null}
    </div>
  )
}
