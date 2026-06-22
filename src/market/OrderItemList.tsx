import { OrderLineRow } from './OrderLineRow';
import type { CartItem } from './types';

type Props = {
  items: CartItem[];
};

export function OrderItemList({ items }: Props) {
  return (
    <div className="section">
      <h2>주문 상품</h2>
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
    </div>
  );
}
