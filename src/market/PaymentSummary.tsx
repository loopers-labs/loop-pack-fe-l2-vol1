import { Price } from './Price'
import { SubtotalLine, ShippingLine, CouponLine, PointLine } from './OrderLines'
import { useCheckout } from './context'

export function PaymentSummary() {
  const { summary, appliedCoupon, usePoint, member } = useCheckout()
  const { itemTotal, shippingFee, couponDiscount, pointDiscount, finalPrice } = summary

  return (
    <div className="section">
      <h2>결제 금액</h2>
      <SubtotalLine amount={itemTotal} />
      <ShippingLine amount={shippingFee} />
      {appliedCoupon ? <CouponLine amount={couponDiscount} code={appliedCoupon.code} /> : null}
      {usePoint ? <PointLine amount={pointDiscount} /> : null}
      <div className="total">
        <span>최종 결제 금액</span>
        <Price amount={finalPrice} member={member} />
      </div>
    </div>
  )
}
