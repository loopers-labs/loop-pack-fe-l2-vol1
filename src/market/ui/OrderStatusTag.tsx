// 유니톤 타입 활용으로 6번 체크리스트 해결
type OrderStatus = 'paid' | 'preparing' | 'shipped' | 'delivered' | 'cancelled';

// 객체를 활용하여 label과 color 매핑
const STATUS_MAP: Record<OrderStatus, { label: string; color: string }> = {
  paid: { label: '결제완료', color: '#3b82f6' },
  preparing: { label: '상품 준비중', color: '#f59e0b' },
  shipped: { label: '배송중', color: '#8b5cf6' },
  delivered: { label: '배송완료', color: '#22c55e' },
  cancelled: { label: '주문취소', color: '#ef4444' },
};

export function OrderStatusTag({ status }: { status: OrderStatus }) {
  const { label, color } = STATUS_MAP[status];

  return (
    <span className="tag" style={{ color, border: `1px solid ${color}` }}>
      {label}
    </span>
  );
}
