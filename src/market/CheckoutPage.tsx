import { useState } from 'react'
import type { Coupon } from './types'
import { ADDRESSES, CART, MEMBER, PAST_ORDERS, COUPONS } from './data'
import { Price } from './Price'
import { OrderLineRow } from './OrderLineRow'
import { OrderStatusTag } from './OrderStatusTag'
import { DeliveryMemo } from './DeliveryMemo'
import './market.css'
import { DeliveryOrders } from './DeliveryOrders'
import { DeliveryCoupon } from './DeliveryCoupon'
import { DeliveryAddress } from './DeliveryAddress'
import { DeliveryPoint } from './DeliveryPoint'
import { PaymentMethodSection } from './PaymentMethodSection'

export function CheckoutPage() {
  const member = MEMBER
  const cart = CART
  const coupons = COUPONS

  const [selectedAddressId, setSelectedAddressId] = useState(ADDRESSES[0].id)
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null)
  const [usePoint, setUsePoint] = useState(false)
  const [pointInput, setPointInput] = useState(0)

  const [agreed, setAgreed] = useState(false)
  const [isTermsOpen, setIsTermsOpen] = useState(false)
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

      <div className="section">
        <h2>결제 금액</h2>
        <OrderLineRow type="subtotal" label="상품 금액" amount={itemTotal} />
        <OrderLineRow type="shipping" label="배송비" amount={shippingFee} />
        {appliedCoupon ? (
          <OrderLineRow
            type="coupon"
            label="쿠폰 할인"
            amount={couponDiscount}
            isDiscount
            couponCode={appliedCoupon.code}
          />
        ) : null}
        {usePoint ? (
          <OrderLineRow type="point" label="적립금 사용" amount={pointDiscount} isDiscount />
        ) : null}
        <div className="total">
          <span>최종 결제 금액</span>
          <Price amount={finalPrice} member={member} />
        </div>
      </div>

      <div className="section">
        <label>
          <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
          주문 내용 및 약관에 동의합니다
        </label>
        <button className="link" onClick={() => setIsTermsOpen(true)}>
          약관 보기
        </button>
      </div>

      <button className="pay" disabled={!agreed} onClick={() => setPlaced(true)}>
        {finalPrice.toLocaleString()}원 결제하기
      </button>

      {isTermsOpen ? (
        <div className="modal" onClick={() => setIsTermsOpen(false)}>
          <div className="modal-body" onClick={(e) => e.stopPropagation()}>
            <h3>이용 약관</h3>
            <p>주문 후 7일 이내 단순 변심 반품이 가능하며, 도서산간은 배송비가 추가됩니다.</p>
            <button onClick={() => setIsTermsOpen(false)}>닫기</button>
          </div>
        </div>
      ) : null}

      <div className="section">
        <h2>최근 주문</h2>
        {PAST_ORDERS.map((o) => (
          <div key={o.id} className="line">
            <div className="grow">{o.summary}</div>
            <OrderStatusTag
              isPaid={o.status === 'paid'}
              isPreparing={o.status === 'preparing'}
              isShipped={o.status === 'shipped'}
              isDelivered={o.status === 'delivered'}
              isCancelled={o.status === 'cancelled'}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
