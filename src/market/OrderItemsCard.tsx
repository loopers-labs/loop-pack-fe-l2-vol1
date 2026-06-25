import { Card } from "./card";
import { OrderLineRow } from "./OrderLineRow";
import type { CartItem } from "./types";

interface OrderItemsCardProps {
  items: CartItem[];
}

export function OrderItemsCard({ items }: OrderItemsCardProps) {
  return (
    <Card>
      <Card.Title>주문 상품</Card.Title>
      <Card.Body>
        {items.map((it) => (
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
      </Card.Body>
    </Card>
  );
}
