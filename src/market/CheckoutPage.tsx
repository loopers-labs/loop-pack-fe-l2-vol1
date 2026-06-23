import { useState } from 'react'
import type { Coupon } from './types'
import { ADDRESSES, CART, MEMBER, PAST_ORDERS, COUPONS } from './data'
import { DeliveryMemo } from './DeliveryMemo'
import './market.css'
import { DeliveryOrders } from './DeliveryOrders'
import { DeliveryCoupon } from './DeliveryCoupon'
import { DeliveryAddress } from './DeliveryAddress'
import { DeliveryPoint } from './DeliveryPoint'
import { PaymentMethodSection } from './PaymentMethodSection'
import { PaymentSummary } from './PaymentSummary'
import { OrderAgreement } from './OrderAgreement'
import { RecentOrders } from './RecentOrders'

export function CheckoutPage() {
  const member = MEMBER
  const cart = CART
  const coupons = COUPONS

  const [selectedAddressId, setSelectedAddressId] = useState(ADDRESSES[0].id)
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null)
  const [usePoint, setUsePoint] = useState(false)
  const [pointInput, setPointInput] = useState(0)

  const [placed, setPlaced] = useState(false)

  const address = ADDRESSES.find((a) => a.id === selectedAddressId)!

  // ── 배송비 정책 ──────────────────────────────
  const itemTotal = cart.reduce((sum, it) => sum + it.price * it.quantity, 0)
  let shippingFee = 3000
  if (itemTotal >= 50000) shippingFee = 0
  if (address.isRemote) shippingFee += 3000

  // ── 쿠폰 정책 ────────────────────────────────
  const couponDiscount = appliedCoupon ? appliedCoupon.discount : 0

  // ── 적립금 정책 ──────────────────────────────
  const pointDiscount = usePoint ? Math.min(pointInput, member.point, itemTotal) : 0

  // 최종 금액을 state 에 담아둔다.
  const [finalPrice] = useState(itemTotal + shippingFee - couponDiscount - pointDiscount)

  if (placed) {
    return (
      <div className="checkout">
        <h1>주문 완료</h1>
        <div className="section">
          <p style={{ color: 'var(--text-h)' }}>
            주문이 접수되었어요. 결제 금액 {finalPrice.toLocaleString()}원
          </p>
        </div>
        <button className="pay" onClick={() => setPlaced(false)}>
          주문서로 돌아가기
        </button>
      </div>
    )
  }

  return (
    <div className="checkout">
      <h1>주문/결제</h1>

      <DeliveryAddress
        addresses={ADDRESSES}
        selectedAddressId={selectedAddressId}
        onSelectAddress={setSelectedAddressId}
      />
      <DeliveryMemo />
      <DeliveryOrders cart={cart} />
      <DeliveryCoupon
        coupons={coupons}
        appliedCoupon={appliedCoupon}
        setAppliedCoupon={setAppliedCoupon}
      />

      <DeliveryPoint
        usePoint={usePoint}
        setUsePoint={setUsePoint}
        pointInput={pointInput}
        setPointInput={setPointInput}
        point={member.point.toLocaleString()}
      />

      <PaymentMethodSection />

      <PaymentSummary
        summary={{ itemTotal, shippingFee, couponDiscount, pointDiscount, finalPrice }}
        appliedCoupon={appliedCoupon}
        usePoint={usePoint}
        member={member}
      />

      <OrderAgreement finalPrice={finalPrice} onPlace={() => setPlaced(true)} />

      <RecentOrders orders={PAST_ORDERS} />
    </div>
  )
}
