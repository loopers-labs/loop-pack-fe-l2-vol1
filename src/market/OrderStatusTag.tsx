import type { OrderStatus } from "./types";

type Props = {
  status: OrderStatus;
};

export function OrderStatusTag({ status }: Props) {
  let label: string;
  let color: string;

  switch (status) {
    case "paid":
      label = "결제완료";
      color = "#3b82f6";
      break;

    case "preparing":
      label = "상품 준비중";
      color = "#f59e0b";
      break;

    case "shipped":
      label = "배송중";
      color = "#8b5cf6";
      break;

    case "delivered":
      label = "배송완료";
      color = "#22c55e";
      break;

    case "cancelled":
      label = "주문취소";
      color = "#ef4444";
      break;

    default: {
      const exhaustive: never = status;
      return exhaustive;
    }
  }

  return (
    <span className="tag" style={{ color, border: `1px solid ${color}` }}>
      {label}
    </span>
  );
}
