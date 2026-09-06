import type { Order } from '@/entities/order/model/types';
import type { OrderProductMap } from '@/features/order/lib/orderSummary';
import {
  formatOrderDate,
  getOrderItemCount,
  getOrderTotal,
} from '@/features/order/lib/orderSummary';
import { OrderProductList } from '@/features/order/ui/OrderProductList';
import { formatWon } from '@/shared/lib/format';

interface OrderHistoryCardProps {
  order: Order;
  products: OrderProductMap;
  isLoading: boolean;
}

export function OrderHistoryCard({
  order,
  products,
  isLoading,
}: OrderHistoryCardProps) {
  const itemCount = getOrderItemCount(order.items);
  const total = getOrderTotal(order.items, products);

  return (
    <article className="rounded-lg border border-border bg-bg-card p-5 sm:p-8">
      <header className="flex flex-col gap-2 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.1em] text-text-caption">
            주문 번호 {order.id}
          </p>
          <h2 className="mt-1 text-xl font-bold tracking-[-0.02em] text-text">
            {formatOrderDate(order.createdAt)}
          </h2>
        </div>
        <p className="text-[13px] text-text-secondary">상품 {itemCount}개</p>
      </header>

      <div className="py-6">
        <OrderProductList
          items={order.items}
          products={products}
          isLoading={isLoading}
        />
      </div>

      <footer className="flex items-center justify-between gap-4 border-t border-border pt-5">
        <span className="text-[14px] font-medium text-text-secondary">
          결제 금액
        </span>
        <strong className="text-lg text-text">{formatWon(total)}</strong>
      </footer>
    </article>
  );
}
