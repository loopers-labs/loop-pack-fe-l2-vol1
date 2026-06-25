import { PAST_ORDERS } from './data';
import { OrderStatusTag } from './OrderStatusTag';

export function RecentOrdersSection() {
  return (
    <div className="section">
      <h2>최근 주문</h2>
      {PAST_ORDERS.map((o) => (
        <div key={o.id} className="line">
          <div className="grow">{o.summary}</div>
          <OrderStatusTag isPaid={o.status === 'paid'} isPreparing={o.status === 'preparing'} isShipped={o.status === 'shipped'} isDelivered={o.status === 'delivered'} isCancelled={o.status === 'cancelled'} />
        </div>
      ))}
    </div>
  );
}
