import styles from "./OrderStatusTag.module.css";
import type { OrderStatus } from "./types";

interface OrderStatusTagProps {
  orderStatus: OrderStatus;
}

// status별 표시 정보 매핑. OrderStatus가 paid|preparing|shipped|delivered|cancelled 5개로 닫혀 있어, 들어올 값이 항상 이 중 하나라 조회 실패가 없음(default 불필요)
// 기존 boolean 버전엔 "주문 접수" 기본값이 있었지만, 결제완료(paid)가 곧 주문 접수된 상태라 별도 표시가 불필요해 제거함
const STATUS_DISPLAY: Record<OrderStatus, { label: string; color: string }> = {
  paid: { label: "결제완료", color: "#3b82f6" },
  preparing: { label: "상품 준비중", color: "#f59e0b" },
  shipped: { label: "배송중", color: "#8b5cf6" },
  delivered: { label: "배송완료", color: "#22c55e" },
  cancelled: { label: "주문취소", color: "#ef4444" },
};

// 이 컴포넌트는 현재 RecentOrdersCard에서만 쓰이지만 독립 파일로 유지함
// 이름이 특정 화면이 아니라 "주문 상태"라는 범용 개념을 가리켜, 현재는 아니지만 주문 상세·목록 등 다른 화면에서 재사용될 여지가 있기에 합치는 수고를 하지 않음

export function OrderStatusTag({ orderStatus }: OrderStatusTagProps) {
  const { label, color } = STATUS_DISPLAY[orderStatus];

  return (
    <span className={styles.tag} style={{ color, border: `1px solid ${color}` }}>
      {label}
    </span>
  );
}
