// AI 생성 코드
interface OrderResultModalProps {
  finalPrice: number;
  onClose: () => void;
}

export function OrderResultModal({ finalPrice, onClose }: OrderResultModalProps) {
  return (
    <div className="checkout">
      <h1>주문 완료</h1>
      <div className="section">
        <p style={{ color: 'var(--text-h)' }}>주문이 접수되었어요. 결제 금액 {finalPrice.toLocaleString()}원</p>
      </div>
      <button className="pay" onClick={onClose}>
        주문서로 돌아가기
      </button>
    </div>
  );
}
