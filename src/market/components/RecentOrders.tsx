import type { PastOrder } from "../types";
import { OrderStatusTag } from "./OrderStatusTag";

export default function RecentOrders({ orders }: { orders: PastOrder[] }) {
  return (
    <div className="section">
      <h2>최근 주문</h2>
      {orders.map((o) => (
        <div key={o.id} className="line">
          <div className="grow">{o.summary}</div>
          <OrderStatusTag status={o.status} />
        </div>
      ))}
    </div>
  );
}
