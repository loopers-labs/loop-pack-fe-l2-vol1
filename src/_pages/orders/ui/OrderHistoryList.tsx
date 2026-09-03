import type { Order } from "@/entities/order";

const orderDateTimeFormatter = new Intl.DateTimeFormat("ko-KR", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Seoul",
});

type OrderHistoryListProps = {
  orders: Order[];
};

export function OrderHistoryList({ orders }: OrderHistoryListProps) {
  return (
    <div className="grid gap-3">
      {orders.map((order) => {
        const totalQuantity = order.items.reduce((total, item) => total + item.quantity, 0);

        return (
          <article
            key={order.id}
            className="grid gap-3 rounded-gds-lg bg-white p-5 shadow-[inset_0_0_0_1px_var(--color-gds-gray-200)]"
            aria-label={`주문 ${order.id}`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-base font-bold text-gds-gray-900">주문 {order.id}</h2>
              <p className="text-xs text-gds-gray-600">
                {orderDateTimeFormatter.format(new Date(order.createdAt))}
              </p>
            </div>
            <p className="text-sm font-semibold text-gds-gray-900">
              상품 {order.items.length}종 · 총 {totalQuantity}개
            </p>
            <ul className="grid gap-1 text-sm text-gds-gray-700">
              {order.items.map((item) => (
                <li key={item.productId}>
                  {item.productId} {item.quantity}개
                </li>
              ))}
            </ul>
          </article>
        );
      })}
    </div>
  );
}
