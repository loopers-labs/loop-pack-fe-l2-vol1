import type { ReactNode } from 'react';

import type { CartItem } from './types';

function OrderLineRow({ children }: { children: ReactNode }) {
  return <div className="line">{children}</div>;
}

function Product({ item }: { item: CartItem }) {
  return (
    <>
      <span className="thumb">{item.thumbnail}</span>
      <div className="grow">
        <span>{item.name}</span>
        {item.option ? (
          <small>
            {item.option} · 수량 {item.quantity}
          </small>
        ) : null}
      </div>
    </>
  );
}

function Label({
  children,
  caption,
}: {
  children: ReactNode;
  caption?: string;
}) {
  return (
    <div className="grow">
      <span>{children}</span>
      {caption ? <small>{caption}</small> : null}
    </div>
  );
}

function Amount({
  amount,
  isDiscount = false,
}: {
  amount: number;
  isDiscount?: boolean;
}) {
  if (isDiscount) {
    return (
      <strong style={{ color: '#ef4444' }}>
        - {amount.toLocaleString()}원
      </strong>
    );
  }

  return (
    <strong style={{ color: 'var(--text-h)' }}>
      {amount.toLocaleString()}원
    </strong>
  );
}

OrderLineRow.Product = Product;
OrderLineRow.Label = Label;
OrderLineRow.Amount = Amount;

export { OrderLineRow };
