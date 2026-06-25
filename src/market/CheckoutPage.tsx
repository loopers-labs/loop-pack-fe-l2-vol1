import { For, Show } from '@ilokesto/utilinent'
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
import { OrderLineRow } from '@/features/market'
import {
  Button,
  Checkbox,
  Heading,
  Label,
  Modal,
  Price,
  Radio,
  RadioGroup,
  SectionCard,
  Textarea,
} from '@/shared/ui'
import {
  CouponCodeSection,
  DeliverySection,
  OrderItemsSection,
  PointSection,
  RecentOrderSection,
} from '@/widgets/market'

const PAYMENT_LABEL: Record<PaymentMethod, string> = {
  card: '신용/체크카드',
  transfer: '계좌이체',
  kakao: '카카오페이',
}

const PAYMENT_METHODS: Array<PaymentMethod> = ['card', 'transfer', 'kakao']

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
  if (placed) {
    return (
      <div className="mx-auto max-w-120 px-4 pt-6 pb-24 text-left text-(--text)">
        <Heading.H1>주문 완료</Heading.H1>
        <SectionCard>
          <p className="text-(--text-h)">
            주문이 접수되었어요. 결제 금액{' '}
            <Price value={priceQuote.memberDisplayPrice} />
          </p>
        </SectionCard>
        <Button
          type="button"
          className="sticky bottom-4 mt-2 w-full rounded-xl p-3.75 text-base font-semibold"
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
    <div className="mx-auto max-w-120 px-4 pt-6 pb-24 text-left text-(--text)">
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

      <SectionCard>
        <Heading.H2>결제수단</Heading.H2>
        <RadioGroup legend="결제수단" legendClassName="sr-only">
          <For each={PAYMENT_METHODS}>
            {(method) => (
              <Label key={method}>
                <Radio
                  name="payment"
                  checked={payment === method}
                  onChange={() => {
                    setPayment(method)
                  }}
                />
                {PAYMENT_LABEL[method]}
              </Label>
            )}
          </For>
        </RadioGroup>
      </SectionCard>

      <SectionCard>
        <Heading.H2>결제 금액</Heading.H2>
        <OrderLineRow
          kind="amount"
          label="상품 금액"
          amount={priceQuote.itemTotal}
        />
        <OrderLineRow
          kind="amount"
          label="배송비"
          amount={priceQuote.shippingFee}
        />
        <Show when={appliedCoupon}>
          {(coupon) => (
            <OrderLineRow
              kind="coupon-discount"
              coupon={coupon}
              amount={priceQuote.couponDiscount}
            />
          )}
        </Show>
        <Show when={priceQuote.pointDiscount > 0}>
          <OrderLineRow
            kind="point-discount"
            amount={priceQuote.pointDiscount}
          />
        </Show>
        <div className="mt-2 flex items-center justify-between border-t border-(--border) pt-3 font-semibold text-(--text-h)">
          <span>최종 결제 금액</span>
          <Price value={priceQuote.memberDisplayPrice} />
        </div>
      </SectionCard>

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
    </div>
  )
}
