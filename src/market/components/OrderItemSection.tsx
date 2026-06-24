import { CART } from '../data';
import { OrderLineRow } from '../OrderLineRow';
import { SectionContainer } from './container';

// TODO: CheckoutPage 컴포넌트는 page 폴더, 이외 컴포넌트는 각 섹션을 별도의 폴더에 넣는 것 고려해보기
export const OrderItemSection = () => {
  const cart = CART;
  return (
    <SectionContainer title="주문 상품">
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
    </SectionContainer>
  );
};
