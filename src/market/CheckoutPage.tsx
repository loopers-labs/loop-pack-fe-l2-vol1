import { Show } from '@ilokesto/utilinent'
import { ErrorBoundary } from '@suspensive/react'
import { useState } from 'react'

import {
  CheckoutPriceQuote,
  type Coupon,
  marketService,
  NoDeliveryAddressConfiguredError,
  type PaymentMethod,
  resolveDeliveryAddress,
} from '@/entities/market'
import {
  Button,
  Checkbox,
  Heading,
  Label,
  Modal,
  SectionCard,
  Textarea,
} from '@/shared/ui'
import {
  CouponCodeSection,
  DeliverySection,
  OrderCompleteSection,
  OrderItemsSection,
  PaymentMethodSection,
  PaymentSummarySection,
  PointSection,
  RecentOrderSection,
} from '@/widgets/market'

const PAYMENT_DICT: Record<PaymentMethod, string> = {
  card: '신용/체크카드',
  transfer: '계좌이체',
  kakao: '카카오페이',
}

export function CheckoutPage() {
  const addresses = marketService.getAddresses()
  const cartItems = marketService.getCartItems()
  const member = marketService.getMember()

  const [selectedAddressId, setSelectedAddressId] = useState(
    addresses[0]?.id ?? '',
  )
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null)
  const [pointInput, setPointInput] = useState(0)
  const [payment, setPayment] = useState<PaymentMethod>('card')
  const [isTermsOpen, setIsTermsOpen] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const [placed, setPlaced] = useState(false)

  const selectedAddress = resolveDeliveryAddress(addresses, selectedAddressId)
  const priceQuote = new CheckoutPriceQuote({
    cartItems,
    selectedAddress,
    appliedCoupon,
    pointInput,
    member,
  })

  return (
    <Show.div
      when={!placed}
      className="mx-auto max-w-120 px-4 pt-6 pb-24 text-left text-(--text)"
      fallback={
        <OrderCompleteSection
          setPlaced={setPlaced}
          memberDisplayPrice={priceQuote.memberDisplayPrice}
        />
      }
    >
      <>
        <Heading.H1>주문/결제</Heading.H1>

        <ErrorBoundary
          shouldCatch={NoDeliveryAddressConfiguredError}
          fallback={null}
        >
          <DeliverySection
            addresses={addresses}
            selectedAddressId={selectedAddressId}
            onSelectAddress={setSelectedAddressId}
          />
        </ErrorBoundary>

        <SectionCard>
          <Heading.H2>배송 요청사항</Heading.H2>
          <Textarea placeholder="배송 시 요청사항 (예: 부재 시 문 앞에 두세요)" />
        </SectionCard>

        <OrderItemsSection items={cartItems} />

        <CouponCodeSection onAppliedCoupon={setAppliedCoupon} />

        <PointSection
          currentPoint={member.point}
          onPointInputChange={setPointInput}
        />

        <PaymentMethodSection
          paymentOptions={PAYMENT_DICT}
          defaultPayment={payment}
          onChangePayment={setPayment}
        />

        <PaymentSummarySection
          itemTotal={priceQuote.itemTotal}
          shippingFee={priceQuote.shippingFee}
          couponDiscount={priceQuote.couponDiscount}
          pointDiscount={priceQuote.pointDiscount}
          memberDisplayPrice={priceQuote.memberDisplayPrice}
          appliedCoupon={appliedCoupon}
        />

        <SectionCard>
          <Label>
            <Checkbox
              checked={agreed}
              onChange={(e) => {
                setAgreed(e.target.checked)
              }}
            />
            주문 내용 및 약관에 동의합니다
          </Label>
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
          className="sticky bottom-4 mt-2 w-full rounded-xl p-3.75 text-base font-semibold"
          disabled={!agreed}
          variant="primary"
          onClick={() => {
            setPlaced(true)
          }}
        >
          {priceQuote.memberDisplayPrice.toLocaleString()}원 결제하기
        </Button>

        <Show when={isTermsOpen}>
          <Modal headingId="terms-title">
            <Heading.H3 id="terms-title">이용 약관</Heading.H3>
            <p>
              주문 후 7일 이내 단순 변심 반품이 가능하며, 도서산간은 배송비가
              추가됩니다.
            </p>
            <Button
              type="button"
              onClick={() => {
                setIsTermsOpen(false)
              }}
            >
              닫기
            </Button>
          </Modal>
        </Show>

        <RecentOrderSection />
      </>
    </Show.div>
  )
}
