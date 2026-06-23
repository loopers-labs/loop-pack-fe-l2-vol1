import { useState } from 'react'
import { ADDRESSES, CART, MEMBER, PAST_ORDERS, COUPONS } from './data'
import { CheckoutProvider } from './context'
import { DeliveryMemo } from './DeliveryMemo'
import './market.css'
import { DeliveryOrders } from './DeliveryOrders'
import { DeliveryCoupon } from './DeliveryCoupon'
import { DeliveryAddress } from './DeliveryAddress'
import { DeliveryPoint } from './DeliveryPoint'
import { PaymentMethodSection } from './PaymentMethodSection'
import { PaymentSummary } from './PaymentSummary'
import { OrderAgreement } from './OrderAgreement'
import { OrderComplete } from './OrderComplete'
import { RecentOrders } from './RecentOrders'

export function CheckoutPage() {
  return (
    <CheckoutProvider cart={CART} addresses={ADDRESSES} coupons={COUPONS} member={MEMBER}>
      <CheckoutContent />
    </CheckoutProvider>
  )
}

function CheckoutContent() {
  // 주문 완료 화면 전환은 이 화면 전용 UI 상태이므로 로컬에 둔다.
  const [placed, setPlaced] = useState(false)

  if (placed) {
    return <OrderComplete onBack={() => setPlaced(false)} />
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
