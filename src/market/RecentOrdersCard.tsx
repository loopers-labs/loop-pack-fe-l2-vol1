import { Card } from "./card";
import { PAST_ORDERS } from "./data";
import { OrderStatusTag } from "./OrderStatusTag";

export function RecentOrdersCard() {
  return (
    <Card>
      <Card.Title>최근 주문</Card.Title>
      <Card.Body>
        {PAST_ORDERS.map((o) => (
          <div key={o.id} className="line">
            <div className="grow">{o.summary}</div>
            {/* o.status는 이미 OrderStatus 타입이라 그대로 넘김.
              값이 5개 union 안에 드는지는 타입이 보장하므로 런타임 검사(=== 비교)가 불필요.
            */}
            <OrderStatusTag orderStatus={o.status} />
          </div>
        ))}
      </Card.Body>
    </Card>
  );
}
