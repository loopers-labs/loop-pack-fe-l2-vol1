import { PAST_ORDERS } from "./data";
import { OrderStatusTag } from "./OrderStatusTag";

export function RecentOrderSection() {
  return (
    <div className="section">
      <h2>최근 주문</h2>
      {PAST_ORDERS.map((o) => (
        <div key={o.id} className="line">
          <div className="grow">{o.summary}</div>
          <OrderStatusTag status={o.status} />
        </div>
      ))}
    </div>
  );
}
