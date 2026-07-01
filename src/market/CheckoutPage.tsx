import { useState } from 'react'
import type { Address, Coupon, PaymentMethod } from './types'
import { ADDRESSES, CART, COUPONS, MEMBER, PAST_ORDERS } from './data'
import { Price } from './Price'
import { OrderLineRow } from './OrderLineRow'
import { OrderStatusTag } from './OrderStatusTag'
import { DeliveryMemo } from './DeliveryMemo'
import {
  createCheckoutSummary,
  createProductOrderLines,
  createPaymentOrderLines,
} from './checkoutModel'
import './market.css'

const PAYMENT_LABEL: Record<PaymentMethod, string> = {
  card: '신용/체크카드',
  transfer: '계좌이체',
  kakao: '카카오페이',
}

// 배송지 — 접기/펼치기와 선택 요약은 스스로 책임진다.
// 단, 실제 선택 동작(onSelectAddress)은 AddressForm → AddressField 로 통과시킨다.
function DeliverySection({
  addresses,
  selectedAddressId,
  onSelectAddress,
}: {
  addresses: Address[]
  selectedAddressId: string
  onSelectAddress: (id: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const selected = addresses.find((a) => a.id === selectedAddressId)
  if (!selected) return null
  return (
    <div className="section">
      <div className="row between">
        <h2>배송지</h2>
        <button className="link" onClick={() => setExpanded((v) => !v)}>
          {expanded ? '접기' : '변경'}
        </button>
      </div>
      {expanded ? (
        <AddressForm
          addresses={addresses}
          selectedAddressId={selectedAddressId}
          onSelectAddress={onSelectAddress}
        />
      ) : (
        <p className="addr-summary">
          {selected.label} · {selected.recipient} ({selected.detail})
        </p>
      )}
    </div>
  )
}

// '도서산간 제외' 필터는 스스로 책임진다.
// 선택 동작(onSelectAddress)은 그대로 AddressField 로 통과시킨다.
function AddressForm({
  addresses,
  selectedAddressId,
  onSelectAddress,
}: {
  addresses: Address[]
  selectedAddressId: string
  onSelectAddress: (id: string) => void
}) {
  const [onlyNear, setOnlyNear] = useState(false)
  const list = onlyNear ? addresses.filter((a) => !a.isRemote) : addresses
  return (
    <>
      <label className="filter">
        <input
          type="checkbox"
          checked={onlyNear}
          onChange={(e) => setOnlyNear(e.target.checked)}
        />
        도서산간 제외
      </label>
      {list.map((a) => (
        <AddressField
          key={a.id}
          address={a}
          selected={a.id === selectedAddressId}
          onSelect={onSelectAddress}
        />
      ))}
    </>
  )
}

function AddressField({
  address,
  selected,
  onSelect,
}: {
  address: Address
  selected: boolean
  onSelect: (id: string) => void
}) {
  return (
    <label className="addr">
      <input
        type="radio"
        checked={selected}
        onChange={() => onSelect(address.id)}
      />
      <span>
        {address.label} · {address.recipient} ({address.detail})
        {address.isRemote ? ' · 도서산간' : ''}
      </span>
    </label>
  )
}

// 모달은 자기 열림 상태를 직접 소유한다.
function TermsModal() {
  const [isOpen, setIsOpen] = useState(false)
  return (
    <>
      <button className="link" onClick={() => setIsOpen(true)}>
        약관 보기
      </button>
      {isOpen ? (
        <div className="modal" onClick={() => setIsOpen(false)}>
          <div className="modal-body" onClick={(e) => e.stopPropagation()}>
            <h3>이용 약관</h3>
            <p>
              주문 후 7일 이내 단순 변심 반품이 가능하며, 도서산간은 배송비가
              추가됩니다.
            </p>
            <button onClick={() => setIsOpen(false)}>닫기</button>
          </div>
        </div>
      ) : null}
    </>
  )
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
  const [agreed, setAgreed] = useState(false)
  const [placed, setPlaced] = useState(false)

  const address =
    ADDRESSES.find((a) => a.id === selectedAddressId) ?? ADDRESSES[0]

  const summary = createCheckoutSummary({
    cart,
    address,
    member,
    appliedCoupon,
    usePoint,
    pointInput,
  })
  const productLines = createProductOrderLines(cart)
  const paymentLines = createPaymentOrderLines({
    summary,
    appliedCoupon,
    usePoint,
  })

  const applyCoupon = () => {
    const found = COUPONS.find((c) => c.code === couponCode.trim())
    setAppliedCoupon(found ?? null)
    if (!found) alert('존재하지 않는 쿠폰이에요')
  }

  if (placed) {
    return (
      <div className="checkout">
        <h1>주문 완료</h1>
        <div className="section">
          <p style={{ color: 'var(--text-h)' }}>
            주문이 접수되었어요. 결제 금액{' '}
            {summary.payableAmount.toLocaleString()}원
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

      <DeliverySection
        addresses={ADDRESSES}
        selectedAddressId={selectedAddressId}
        onSelectAddress={setSelectedAddressId}
      />

      <div className="section">
        <h2>배송 요청사항</h2>
        <DeliveryMemo />
      </div>

      <div className="section">
        <h2>주문 상품</h2>
        {productLines.map((line) => (
          <OrderLineRow key={line.id} {...line} />
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
          <button onClick={applyCoupon}>적용</button>
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
            <input
              type="radio"
              checked={payment === m}
              onChange={() => setPayment(m)}
            />
            {PAYMENT_LABEL[m]}
          </label>
        ))}
      </div>

      <div className="section">
        <h2>결제 금액</h2>
        {paymentLines.map((line) => (
          <OrderLineRow key={line.kind} {...line} />
        ))}
        <div className="total">
          <span>최종 결제 금액</span>
          <Price amount={summary.payableAmount} />
        </div>
      </div>

      <div className="section">
        <label>
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
          />
          주문 내용 및 약관에 동의합니다
        </label>
        <TermsModal />
      </div>

      <button
        className="pay"
        disabled={!agreed}
        onClick={() => setPlaced(true)}
      >
        {summary.payableAmount.toLocaleString()}원 결제하기
      </button>

      <div className="section">
        <h2>최근 주문</h2>
        {PAST_ORDERS.map((o) => (
          <div key={o.id} className="line">
            <div className="grow">{o.summary}</div>
            <OrderStatusTag status={o.status} />
          </div>
        ))}
      </div>
    </div>
  )
}
