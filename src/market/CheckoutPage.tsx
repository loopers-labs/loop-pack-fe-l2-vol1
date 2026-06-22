import './market.css'

import { For, Show } from '@ilokesto/utilinent'
import { useState } from 'react'

import {
  type Address,
  type Coupon,
  MarketPricingPolicy,
  MarketService,
  type PaymentMethod,
} from '../entities/market'
import { Button, Heading, Modal, SectionCard } from '../shared/ui'
import { DeliveryMemo } from './DeliveryMemo'
import { OrderLineRow } from './OrderLineRow'
import { OrderStatusTag } from './OrderStatusTag'
import { Price } from './Price'

const PAYMENT_LABEL: Record<PaymentMethod, string> = {
  card: '신용/체크카드',
  transfer: '계좌이체',
  kakao: '카카오페이',
}

const PAYMENT_METHODS: Array<PaymentMethod> = ['card', 'transfer', 'kakao']

// 배송지 — 접기/펼치기와 선택 요약은 스스로 책임진다.
// 단, 실제 선택 동작(onSelectAddress)은 AddressForm → AddressField 로 통과시킨다.
function DeliverySection({
  addresses,
  selectedAddressId,
  onSelectAddress,
}: {
  addresses: Array<Address>
  selectedAddressId: string
  onSelectAddress: (id: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const selected =
    addresses.find((address) => address.id === selectedAddressId) ??
    addresses.at(0)

  if (!selected) {
    return null
  }

  return (
    <SectionCard>
      <div className="row between">
        <Heading.H2>배송지</Heading.H2>
        <Button
          type="button"
          variant="link"
          onClick={() => {
            setExpanded((v) => !v)
          }}
        >
          <Show when={expanded} fallback="변경">
            접기
          </Show>
        </Button>
      </div>
      <Show
        when={expanded}
        fallback={
          <p className="addr-summary">
            {selected.label} · {selected.recipient} ({selected.detail})
          </p>
        }
      >
        <AddressForm
          addresses={addresses}
          selectedAddressId={selectedAddressId}
          onSelectAddress={onSelectAddress}
        />
      </Show>
    </SectionCard>
  )
}

// '도서산간 제외' 필터는 스스로 책임진다.
// 선택 동작(onSelectAddress)은 그대로 AddressField 로 통과시킨다.
function AddressForm({
  addresses,
  selectedAddressId,
  onSelectAddress,
}: {
  addresses: Array<Address>
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
          onChange={(e) => {
            setOnlyNear(e.target.checked)
          }}
        />
        도서산간 제외
      </label>
      <For each={list}>
        {(address) => (
          <AddressField
            key={address.id}
            address={address}
            selected={address.id === selectedAddressId}
            onSelect={onSelectAddress}
          />
        )}
      </For>
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
        onChange={() => {
          onSelect(address.id)
        }}
      />
      <span>
        {address.label} · {address.recipient} ({address.detail})
        <Show when={address.isRemote}> · 도서산간</Show>
      </span>
    </label>
  )
}

export function CheckoutPage() {
  const { addresses, cartItems, coupons, member, pastOrders } =
    MarketService.getMarketSnapshot()

  const [selectedAddressId, setSelectedAddressId] = useState(
    addresses[0]?.id ?? '',
  )
  const [couponCode, setCouponCode] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null)
  const [usePoint, setUsePoint] = useState(false)
  const [pointInput, setPointInput] = useState(0)
  const [payment, setPayment] = useState<PaymentMethod>('card')
  const [isTermsOpen, setIsTermsOpen] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const [placed, setPlaced] = useState(false)

  const address =
    addresses.find((item) => item.id === selectedAddressId) ?? addresses.at(0)

  if (!address) {
    throw new Error('No delivery address configured')
  }

  const itemTotal = MarketPricingPolicy.calculateItemTotal(cartItems)
  const shippingFee = MarketPricingPolicy.calculateShippingFee(
    itemTotal,
    address,
  )
  const couponDiscount =
    MarketPricingPolicy.calculateCouponDiscount(appliedCoupon)
  const pointDiscount = MarketPricingPolicy.calculatePointDiscount({
    enabled: usePoint,
    pointInput,
    member,
    itemTotal,
  })
  const finalPrice = MarketPricingPolicy.calculateFinalPrice({
    itemTotal,
    shippingFee,
    couponDiscount,
    pointDiscount,
  })

  const applyCoupon = () => {
    const found = coupons.find((coupon) => coupon.code === couponCode.trim())
    setAppliedCoupon(found ?? null)
    if (!found) alert('존재하지 않는 쿠폰이에요')
  }

  if (placed) {
    return (
      <div className="checkout">
        <Heading.H1>주문 완료</Heading.H1>
        <SectionCard>
          <p style={{ color: 'var(--text-h)' }}>
            주문이 접수되었어요. 결제 금액 {finalPrice.toLocaleString()}원
          </p>
        </SectionCard>
        <Button
          type="button"
          className="checkout-primary-action"
          variant="primary"
          onClick={() => {
            setPlaced(false)
          }}
        >
          주문서로 돌아가기
        </Button>
      </div>
    )
  }

  return (
    <div className="checkout">
      <Heading.H1>주문/결제</Heading.H1>

      <DeliverySection
        addresses={addresses}
        selectedAddressId={selectedAddressId}
        onSelectAddress={setSelectedAddressId}
      />

      <SectionCard>
        <Heading.H2>배송 요청사항</Heading.H2>
        <DeliveryMemo />
      </SectionCard>

      <SectionCard>
        <Heading.H2>주문 상품</Heading.H2>
        <For each={cartItems}>
          {(item) => (
            <OrderLineRow
              key={item.id}
              type="product"
              label={item.name}
              amount={item.price * item.quantity}
              thumbnail={item.thumbnail}
              option={item.option}
              quantity={item.quantity}
            />
          )}
        </For>
      </SectionCard>

      <SectionCard>
        <Heading.H2>쿠폰</Heading.H2>
        <div className="row">
          <input
            type="text"
            value={couponCode}
            onChange={(e) => {
              setCouponCode(e.target.value)
            }}
            placeholder="쿠폰 코드 (예: WELCOME5000)"
          />
          <Button type="button" onClick={applyCoupon}>
            적용
          </Button>
        </div>
        <Show when={appliedCoupon}>
          {(coupon) => <small>{coupon.label} 적용됨</small>}
        </Show>
      </SectionCard>

      <SectionCard>
        <Heading.H2>적립금</Heading.H2>
        <label>
          <input
            type="checkbox"
            checked={usePoint}
            onChange={(e) => {
              setUsePoint(e.target.checked)
            }}
          />
          적립금 사용 (보유 {member.point.toLocaleString()}P)
        </label>
        <Show when={usePoint}>
          <input
            type="number"
            value={pointInput}
            onChange={(e) => {
              setPointInput(Number(e.target.value))
            }}
          />
        </Show>
      </SectionCard>

      <SectionCard>
        <Heading.H2>결제수단</Heading.H2>
        <For each={PAYMENT_METHODS}>
          {(method) => (
            <label key={method}>
              <input
                type="radio"
                checked={payment === method}
                onChange={() => {
                  setPayment(method)
                }}
              />
              {PAYMENT_LABEL[method]}
            </label>
          )}
        </For>
      </SectionCard>

      <SectionCard>
        <Heading.H2>결제 금액</Heading.H2>
        <OrderLineRow type="subtotal" label="상품 금액" amount={itemTotal} />
        <OrderLineRow type="shipping" label="배송비" amount={shippingFee} />
        <Show when={appliedCoupon}>
          {(coupon) => (
            <OrderLineRow
              type="coupon"
              label="쿠폰 할인"
              amount={couponDiscount}
              isDiscount
              couponCode={coupon.code}
            />
          )}
        </Show>
        <Show when={usePoint}>
          <OrderLineRow
            type="point"
            label="적립금 사용"
            amount={pointDiscount}
            isDiscount
          />
        </Show>
        <div className="total">
          <span>최종 결제 금액</span>
          <Price amount={finalPrice} member={member} />
        </div>
      </SectionCard>

      <SectionCard>
        <label>
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => {
              setAgreed(e.target.checked)
            }}
          />
          주문 내용 및 약관에 동의합니다
        </label>
        <Button
          type="button"
          variant="link"
          onClick={() => {
            setIsTermsOpen(true)
          }}
        >
          약관 보기
        </Button>
      </SectionCard>

      <Button
        type="button"
        className="checkout-primary-action"
        disabled={!agreed}
        variant="primary"
        onClick={() => {
          setPlaced(true)
        }}
      >
        {finalPrice.toLocaleString()}원 결제하기
      </Button>

      <Show when={isTermsOpen}>
        <Modal
          heading="이용 약관"
          headingId="terms-title"
          footer={
            <Button
              type="button"
              onClick={() => {
                setIsTermsOpen(false)
              }}
            >
              닫기
            </Button>
          }
        >
          <p>
            주문 후 7일 이내 단순 변심 반품이 가능하며, 도서산간은 배송비가
            추가됩니다.
          </p>
        </Modal>
      </Show>

      <SectionCard>
        <Heading.H2>최근 주문</Heading.H2>
        <For each={pastOrders}>
          {(order) => (
            <div key={order.id} className="line">
              <div className="grow">{order.summary}</div>
              <OrderStatusTag status={order.status} />
            </div>
          )}
        </For>
      </SectionCard>
    </div>
  )
}
