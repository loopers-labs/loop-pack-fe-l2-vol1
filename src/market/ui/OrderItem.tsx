import { CART } from '../data';
import { OrderLineRow } from './OrderLineRow';
import { SectionContainer } from '../shared/ui/container';

export const OrderItem = () => {
  const cart = CART;
  return (
    <SectionContainer title="주문 상품">
      {cart.map((it) => (
        <OrderLineRow
          key={it.id}
          label={it.name}
          amount={it.price * it.quantity}
          thumbnail={it.thumbnail}
          option={it.option}
          quantity={it.quantity}
        />
      ))}
    </SectionContainer>
  );
};
