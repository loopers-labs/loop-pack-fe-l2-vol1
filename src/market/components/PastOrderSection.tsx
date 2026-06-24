import { PAST_ORDERS } from '../data';
import { OrderStatusTag } from '../OrderStatusTag';
import { SectionContainer } from './container';

export const PastOrderSection = () => {
  return (
    <SectionContainer title="최근 주문">
      {PAST_ORDERS.map((o) => (
        <div key={o.id} className="line">
          <div className="grow">{o.summary}</div>
          <OrderStatusTag
            isPaid={o.status === 'paid'}
            isPreparing={o.status === 'preparing'}
            isShipped={o.status === 'shipped'}
            isDelivered={o.status === 'delivered'}
            isCancelled={o.status === 'cancelled'}
          />
        </div>
      ))}
    </SectionContainer>
  );
};
