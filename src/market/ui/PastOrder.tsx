import { PAST_ORDERS } from '../data';
import { OrderStatusTag } from './OrderStatusTag';
import { SectionContainer } from '../shared/ui/container';

// TODO: boolean 폭발
export const PastOrder = () => {
  return (
    <SectionContainer title="최근 주문">
      {PAST_ORDERS.map((o) => (
        <div key={o.id} className="line">
          <div className="grow">{o.summary}</div>
          <OrderStatusTag status={o.status} />
        </div>
      ))}
    </SectionContainer>
  );
};
