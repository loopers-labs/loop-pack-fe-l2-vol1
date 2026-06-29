import { Show } from '@ilokesto/utilinent'

import type { CheckoutPriceQuote, Coupon } from '@/entities/market'
import { OrderLineRow } from '@/features/market'
import { Heading, Price, SectionCard } from '@/shared/ui'

type PaymentSummarySectionProps = {
  priceQuote: CheckoutPriceQuote
  appliedCoupon: Coupon | null
}

export function PaymentSummarySection({
  priceQuote,
  appliedCoupon,
}: PaymentSummarySectionProps) {
  return (
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
        <OrderLineRow kind="point-discount" amount={priceQuote.pointDiscount} />
      </Show>

      <Show when={priceQuote.memberDiscount > 0}>
        <OrderLineRow
          kind="member-discount"
          amount={priceQuote.memberDiscount}
        />
      </Show>

      <div className="mt-2 flex items-center justify-between border-t border-(--border) pt-3 font-semibold text-(--text-h)">
        <span>최종 결제 금액</span>
        <Price amount={priceQuote.payableAmount} />
      </div>
    </SectionCard>
  )
}
