import type { OrderStatus } from "../../types";

const ORDER_STATUS_DISPLAY = {
  pending: {
    label: "주문 접수",
    color: "#9ca3af",
  },
  paid: {
    label: "결제완료",
    color: "#3b82f6",
  },
  preparing: {
    label: "상품 준비중",
    color: "#f59e0b",
  },
  shipped: {
    label: "배송중",
    color: "#8b5cf6",
  },
  delivered: {
    label: "배송완료",
    color: "#22c55e",
  },
  cancelled: {
    label: "주문취소",
    color: "#ef4444",
  },
};

type OrderStatusTagProps = { status: OrderStatus };

export function OrderStatusTag({ status }: OrderStatusTagProps) {
  const color = ORDER_STATUS_DISPLAY[status].color;
  const label = ORDER_STATUS_DISPLAY[status].label;
  return (
    <span className="tag" style={{ color, border: `1px solid ${color}` }}>
      {label}
    </span>
  );
}
