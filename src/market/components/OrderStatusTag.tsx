import { type OrderStatus } from '../types';

type OrderStatusTagProps = {
  status: OrderStatus;
};

const STATUS_MAP: Record<OrderStatus, { label: string; color: string }> = {
  paid: { label: '결제완료', color: '#3b82f6' },
  preparing: { label: '상품 준비중', color: '#f59e0b' },
  shipped: { label: '배송중', color: '#8b5cf6' },
  delivered: { label: '배송완료', color: '#22c55e' },
  cancelled: { label: '주문취소', color: '#ef4444' },
};

/**
 * 주문 상태 뱃지.
 *
 * - 원인: boolean  Props 5개로 boolean 폭발 [ true 로 여러개의 props가 넘어오면 상태가 겹침 ] → 결과: `status` 단일 union + 매핑 객체로 바꿔 불가능한 상태를 타입으로 차단
 */
export function OrderStatusTag({ status }: OrderStatusTagProps) {
  const { label, color } = STATUS_MAP[status];

  return (
    <span className="tag" style={{ color, border: `1px solid ${color}` }}>
      {label}
    </span>
  );
}
