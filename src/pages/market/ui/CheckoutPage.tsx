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
import type { PaymentMethodOption } from '@/features/market'
import { Button, Heading, SectionCard, Textarea } from '@/shared/ui'
import {
  CheckoutTermsSection,
  CouponCodeSection,
  DeliverySection,
  OrderCompleteSection,
  OrderItemsSection,
  PaymentMethodSection,
  PaymentSummarySection,
  PointSection,
  RecentOrderSection,
} from '@/widgets/market'

const PAYMENT_OPTIONS = [
  { value: 'card', label: '신용/체크카드' },
  { value: 'transfer', label: '계좌이체' },
  { value: 'kakao', label: '카카오페이' },
] satisfies Array<PaymentMethodOption<PaymentMethod>>

export function CheckoutPage() {
  const addresses = marketService.getAddresses()
  const cartItems = marketService.getCartItems()
  const member = marketService.getMember()

  const [selectedAddressId, setSelectedAddressId] = useState(
    addresses[0]?.id ?? '',
  )
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null)
  const [pointsToUse, setPointsToUse] = useState(0)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card')
  const [hasAgreedToTerms, setHasAgreedToTerms] = useState(false)
  const [isOrderPlaced, setIsOrderPlaced] = useState(false)

  const selectedAddress = resolveDeliveryAddress(addresses, selectedAddressId)
  const priceQuote = new CheckoutPriceQuote({
    cartItems,
    selectedAddress,
    appliedCoupon,
    pointsToUse,
    member,
  })

  return (
    <Show.div
      when={!isOrderPlaced}
      className="mx-auto max-w-120 px-4 pt-6 pb-24 text-left text-(--text)"
      fallback={
        <OrderCompleteSection
          onReturnToOrder={() => {
            setIsOrderPlaced(false)
          }}
          payableAmount={priceQuote.payableAmount}
        />
      }
    >
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

      <OrderItemsSection cartItems={cartItems} />

      <CouponCodeSection
        appliedCoupon={appliedCoupon}
        onAppliedCoupon={setAppliedCoupon}
      />

      <PointSection
        currentPoint={member.point}
        onPointsToUseChange={setPointsToUse}
      />

      <PaymentMethodSection
        options={PAYMENT_OPTIONS}
        value={paymentMethod}
        onChange={setPaymentMethod}
      />

      <PaymentSummarySection
        priceQuote={priceQuote}
        appliedCoupon={appliedCoupon}
      />

      <CheckoutTermsSection
        checked={hasAgreedToTerms}
        onCheckedChange={setHasAgreedToTerms}
      />

      <Button
        type="button"
        className="sticky bottom-4 mt-2 w-full rounded-xl p-3.75 text-base font-semibold"
        disabled={!hasAgreedToTerms}
        variant="primary"
        onClick={() => {
          setIsOrderPlaced(true)
        }}
      >
        {priceQuote.payableAmount.toLocaleString()}원 결제하기
      </Button>

      <RecentOrderSection />
    </Show.div>
  )
}
