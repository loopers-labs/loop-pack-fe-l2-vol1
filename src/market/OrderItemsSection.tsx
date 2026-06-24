import { OrderLineRow } from "./OrderLineRow";
import type { CartItem } from "./types";

type OrderItemSectionProps = {
  cart: CartItem[];
};

export function OrderItemsSection({ cart }: OrderItemSectionProps) {
  return (
    <div className="section">
      <h2>주문 상품</h2>
      {cart.map((it) => (
        <OrderLineRow
          key={it.id}
          type="product"
          label={it.name}
          amount={it.price * it.quantity}
          thumbnail={it.thumbnail}
          option={it.option}
          quantity={it.quantity}
        />
      ))}
    </div>
  );
}
