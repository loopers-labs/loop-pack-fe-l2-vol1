import { useState } from 'react'
import type { Coupon, PaymentMethod } from './types'
import { ADDRESSES, CART, COUPONS, MEMBER, PAST_ORDERS } from './data'
import { OrderLineRow } from './_components/OrderLineRow'
import { OrderStatusTag } from './_components/OrderStatusTag'
import { DeliveryMemo } from './_components/DeliveryMemo'
import { DeliverySection } from './_components/DeliverySection'
import { OrderCompleteStep } from './_components/OrderCompleteStep'
import { TermsModal } from './_components/TermsModal'
import './market.css'

const PAYMENT_LABEL: Record<PaymentMethod, string> = {
  card: '신용/체크카드',
  transfer: '계좌이체',
  kakao: '카카오페이',
}

export function CheckoutPage() {
  const member = MEMBER
  const cart = CART

  const [selectedAddressId, setSelectedAddressId] = useState(ADDRESSES[0].id)
  const [couponCode, setCouponCode] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null)
  const [usePoint, setUsePoint] = useState(false)
  const [pointInput, setPointInput] = useState(0)
  const [payment, setPayment] = useState<PaymentMethod>('card')
  const [isTermsOpen, setIsTermsOpen] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const [placed, setPlaced] = useState(false)
  // ② 구현 vs 조합: DeliveryMemo에서 끌어올린 상태
  const [memo, setMemo] = useState('')

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

  // ⑦ 파생 상태: useState 제거 → 렌더링마다 재계산되는 일반 const로 교체
  const totalDiscount = couponDiscount + pointDiscount
  // ① 변화의 경계: VIP 할인을 Price 컴포넌트에서 가격 계산 영역으로 이동
  const subtotal = itemTotal + shippingFee - totalDiscount
  const finalPrice = member.grade === 'VIP' ? Math.round(subtotal * 0.9) : subtotal

  // 컨벤션: 내부 이벤트 핸들러는 handleX 네이밍 적용
  const handleApplyCoupon = () => {
    const found = COUPONS.find((c) => c.code === couponCode.trim())
    setAppliedCoupon(found ?? null)
    if (!found) alert('존재하지 않는 쿠폰이에요')
  }

  // ⑨ Context 전에 composition: 주문 완료 UI를 분리하고 props로 값 전달
  if (placed) {
    return <OrderCompleteStep finalPrice={finalPrice} memo={memo} onBack={() => setPlaced(false)} />
  }

  return (
    <div className="checkout">
      <h1>주문/결제</h1>

      <DeliverySection
        addresses={ADDRESSES}
        selectedAddressId={selectedAddressId}
        onSelectAddress={setSelectedAddressId}
      />

      <div className="section">
        <h2>배송 요청사항</h2>
        <DeliveryMemo value={memo} onChange={setMemo} />
      </div>

      <div className="section">
        <h2>주문 상품</h2>
        {/* ⑤ props 과다 → Composition: 필요한 서브컴포넌트만 조합 */}
        {cart.map((it) => (
          <OrderLineRow key={it.id}>
            <OrderLineRow.Thumbnail thumbnail={it.thumbnail} />
            <OrderLineRow.Label label={it.name} option={`${it.option} · 수량 ${it.quantity} `} />
            <OrderLineRow.Amount amount={it.price * it.quantity} />
          </OrderLineRow>
        ))}
      </div>

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

      <div className="section">
        <h2>적립금</h2>
        <label>
          <input
            type="checkbox"
            checked={usePoint}
            onChange={(e) => setUsePoint(e.target.checked)}
          />
          적립금 사용 (보유 {member.point.toLocaleString()}P)
        </label>
        {usePoint ? (
          <input
            type="number"
            value={pointInput}
            onChange={(e) => setPointInput(Number(e.target.value))}
          />
        ) : null}
      </div>

      <div className="section">
        <h2>결제수단</h2>
        {(['card', 'transfer', 'kakao'] as PaymentMethod[]).map((m) => (
          <label key={m}>
            <input type="radio" checked={payment === m} onChange={() => setPayment(m)} />
            {PAYMENT_LABEL[m]}
          </label>
        ))}
      </div>

      <div className="section">
        <h2>결제 금액</h2>
        {/* ⑤ props 과다 → Composition: type 분기 없이 서브컴포넌트 조합 */}
        <OrderLineRow>
          <OrderLineRow.Label label="상품 금액" />
          <OrderLineRow.Amount amount={itemTotal} />
        </OrderLineRow>
        <OrderLineRow>
          <OrderLineRow.Label label="배송비" />
          <OrderLineRow.Amount amount={shippingFee} />
        </OrderLineRow>
        {appliedCoupon ? (
          <OrderLineRow>
            <OrderLineRow.Label label="쿠폰 할인" option={appliedCoupon.code} />
            <OrderLineRow.Amount amount={couponDiscount} isDiscount />
          </OrderLineRow>
        ) : null}
        {usePoint ? (
          <OrderLineRow>
            <OrderLineRow.Label label="적립금 사용" />
            <OrderLineRow.Amount amount={pointDiscount} isDiscount />
          </OrderLineRow>
        ) : null}
        <div className="total">
          <span>최종 결제 금액</span>
          {/* ④ 성급한 추상화: 한 줄짜리 Price 컴포넌트 제거, 인라인으로 교체 */}
          <strong>{finalPrice.toLocaleString()}원</strong>
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

      {/* ⑩ children vs slot: 모달 패턴을 TermsModal로 분리 */}
      <TermsModal isOpen={isTermsOpen} onClose={() => setIsTermsOpen(false)} />

      <div className="section">
        <h2>최근 주문</h2>
        {PAST_ORDERS.map((o) => (
          <div key={o.id} className="line">
            <div className="grow">{o.summary}</div>
            {/* ⑥ boolean 폭발 → enum: 5개 boolean props 대신 status만 전달 */}
            <OrderStatusTag status={o.status} />
          </div>
        ))}
      </div>
    </div>
  )
}
