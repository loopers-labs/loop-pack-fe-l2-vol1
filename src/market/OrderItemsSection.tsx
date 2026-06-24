import { ProductOrderLine } from "./OrderLines";
import type { CartItem } from "./types";

type OrderItemSectionProps = {
  cart: CartItem[];
};

export function OrderItemsSection({ cart }: OrderItemSectionProps) {
  return (
    <div className="section">
      <h2>주문 상품</h2>
      {cart.map((it) => (
        <ProductOrderLine
          key={it.id}
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
