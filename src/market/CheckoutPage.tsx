import { useState } from 'react'
import { ADDRESSES, CART, MEMBER, PAST_ORDERS, COUPONS } from './data'
import { CheckoutProvider, useCheckout } from './context'
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
  return (
    <CheckoutProvider cart={CART} addresses={ADDRESSES} coupons={COUPONS} member={MEMBER}>
      <CheckoutContent />
    </CheckoutProvider>
  )
}

function CheckoutContent() {
  const { summary } = useCheckout()
  // 주문 완료 화면 전환은 이 화면 전용 UI 상태이므로 로컬에 둔다.
  const [placed, setPlaced] = useState(false)

  if (placed) {
    return (
      <div className="checkout">
        <h1>주문 완료</h1>
        <div className="section">
          <p style={{ color: 'var(--text-h)' }}>
            주문이 접수되었어요. 결제 금액 {summary.finalPrice.toLocaleString()}원
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

      <DeliveryAddress />
      <DeliveryMemo />
      <DeliveryOrders />
      <DeliveryCoupon />
      <DeliveryPoint />
      <PaymentMethodSection />
      <PaymentSummary />
      <OrderAgreement onPlace={() => setPlaced(true)} />

      <RecentOrders orders={PAST_ORDERS} />
    </div>
  )
}
