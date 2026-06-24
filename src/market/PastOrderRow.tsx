import { OrderStatusTag } from './OrderStatusTag';
import type { PastOrder } from './types';

type PastOrderRowProps = {
  order: PastOrder;
};

export function PastOrderRow({ order }: PastOrderRowProps) {
  return (
    <div className="line">
      <div className="grow">{order.summary}</div>
      <OrderStatusTag status={order.status} />
    </div>
  );
}
