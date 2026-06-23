import { Price } from './Price'
import { OrderLineRow } from './OrderLineRow'
import { useCheckout } from './context'

export function PaymentSummary() {
  const { summary, appliedCoupon, usePoint, member } = useCheckout()
  const { itemTotal, shippingFee, couponDiscount, pointDiscount, finalPrice } = summary

  return (
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
  )
}
