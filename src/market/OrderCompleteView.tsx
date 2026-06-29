type OrderCompleteViewProps = {
  finalPrice: number;
  onBackToCheckout: () => void;
};

export function OrderCompleteView({ finalPrice, onBackToCheckout }: OrderCompleteViewProps) {
  return (
    <div className="checkout">
      <h1>주문 완료</h1>
      <div className="section">
        <p style={{ color: "var(--text-h)" }}>
          주문이 접수되었어요. 결제 금액 {finalPrice.toLocaleString()}원
        </p>
      </div>
      <button className="pay" onClick={onBackToCheckout}>
        주문서로 돌아가기
      </button>
    </div>
  );
}
