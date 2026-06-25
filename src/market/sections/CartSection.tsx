import type { CartItem } from '@/market/types/cart.types';
import { Section } from '@/common/components/Section.tsx';
import { LineRow } from '@/common/components/LineRow.tsx';
import { PriceInfo } from '@/common/components/PriceInfo.tsx';

type CartSectionProps = {
  items: CartItem[];
};

export function CartSection({ items }: CartSectionProps) {
  return (
    <Section title={'주문 상품'}>
      {items.map((item) => (
        <LineRow
          key={item.id}
          thumbnail={item.thumbnail}
          rightSlot={<PriceInfo amount={item.price} />}
        >
          <div className="grow">
            <span>{item.name}</span>
            <small>
              {item.option} · 수량 {item.quantity}
            </small>
          </div>
        </LineRow>
      ))}
    </Section>
  );
}
