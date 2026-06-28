import { CART } from './data';
import { CartLine } from './CartLine';

export function CartSection() {
  return (
    <div className="section">
      <h2>주문 상품</h2>
      {CART.map((it) => (
        <CartLine key={it.id} label={it.name} amount={it.price * it.quantity} thumbnail={it.thumbnail} option={it.option} quantity={it.quantity} />
      ))}
    </div>
  );
}
