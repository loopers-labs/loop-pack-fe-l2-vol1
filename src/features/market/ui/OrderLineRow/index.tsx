import { CartItemOrderLine } from './CartItemOrderLine'
import { CheckoutAmountOrderLine } from './CheckoutAmountOrderLine'
import { CouponDiscountOrderLine } from './CouponDiscountOrderLine'
import { MemberDiscountOrderLine } from './MemberDiscountOrderLine'
import { PastOrderLine } from './PastOrderLine'
import { PointDiscountOrderLine } from './PointDiscountOrderLine'
import type { OrderLineRowProps } from './types'

export type { OrderLineRowProps } from './types'

export function OrderLineRow(props: OrderLineRowProps) {
  switch (props.kind) {
    case 'cart-item':
      return <CartItemOrderLine {...props} />

    case 'amount':
      return <CheckoutAmountOrderLine {...props} />

    case 'coupon-discount':
      return <CouponDiscountOrderLine {...props} />

    case 'point-discount':
      return <PointDiscountOrderLine {...props} />

    case 'member-discount':
      return <MemberDiscountOrderLine {...props} />

    case 'past-order':
      return <PastOrderLine {...props} />

    default:
      return assertNeverOrderLineRowProps(props)
  }
}

function assertNeverOrderLineRowProps(value: never): never {
  throw new Error(`Unhandled order line row props: ${JSON.stringify(value)}`)
}
