import { ProductLine } from './OrderLines'
import { useCheckout } from './context'

export function DeliveryOrders() {
  const { cart } = useCheckout()
  return (
    <div className="section">
      <h2>주문 상품</h2>
      {cart.map((it) => (
        <ProductLine key={it.id} item={it} />
      ))}
    </div>
  )
}
