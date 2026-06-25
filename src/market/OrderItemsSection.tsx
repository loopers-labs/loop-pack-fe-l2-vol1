import { ProductOrderLine } from "./OrderLines";
import { Section } from "./Section";
import type { CartItem } from "./types";

type OrderItemSectionProps = {
  cart: CartItem[];
};

export function OrderItemsSection({ cart }: OrderItemSectionProps) {
  return (
    <Section title="주문 상품">
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
    </Section>
  );
}
