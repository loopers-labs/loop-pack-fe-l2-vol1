import type { CartItem } from "../types";
import { OrderLineRow } from "./OrderLineRow";

export default function OrderItemList({ items }: { items: CartItem[] }) {
  return (
    <div className="section">
      <h2>주문 상품</h2>
      {items.map((it) => (
        <OrderLineRow
          key={it.id}
          thumbnail={it.thumbnail}
          amount={it.price * it.quantity}
        >
          <span>{it.name}</span>
          {it.option ? (
            <small>
              {it.option} · 수량 {it.quantity}
            </small>
          ) : null}
        </OrderLineRow>
      ))}
    </div>
  );
}
