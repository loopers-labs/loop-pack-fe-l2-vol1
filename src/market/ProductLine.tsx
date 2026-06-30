// [AI 생성] 직접 검토·수정함
import type { CartItem } from "./types";
import { LineAmount } from "./LineAmount";

type Props = {
  item: CartItem;
};

export function ProductLine({ item }: Props) {
  return (
    <div className="line">
      <span className="thumb">{item.thumbnail}</span>
      <div className="grow">
        <span>{item.name}</span>
        {item.option ? (
          <small>
            {item.option} · 수량 {item.quantity}
          </small>
        ) : null}
      </div>
      <LineAmount amount={item.price * item.quantity} />
    </div>
  );
}
