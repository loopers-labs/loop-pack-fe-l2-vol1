import { PAST_ORDERS } from "../../data";

import { OrderStatusTag } from "./OrderStatusTag";
import { Section } from "../../ui/Section";

export function RecentOrdersSection() {
  return (
    <Section title="최근 주문">
      {PAST_ORDERS.map((o) => (
        <div key={o.id} className="line">
          <div className="grow">{o.summary}</div>
          <OrderStatusTag status={o.status} />
        </div>
      ))}
    </Section>
  );
}
