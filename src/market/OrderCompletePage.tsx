import { Price } from "./Price";

interface OrderCompletePageProps {
  finalPrice: number;
  onBack: () => void;
}

// CheckoutPage가 결제 화면과 완료 화면 두 책임을 갖고 있어(placed로 분기),
// 완료 화면을 별도 컴포넌트로 분리하고, CheckoutPage는 결제 화면에만 집중하게 됨.
// placed 상태는 화면 전환을 책임지는 checkoutPage에서 관리하고,
// 완료 화면은 onBack 콜백으로 "돌아가기" 요청만 올리고 실제 상태 변경은 checkoutPage에서 진행.
export function OrderCompletePage({ finalPrice, onBack }: OrderCompletePageProps) {
  return (
    <div className="checkout">
      <h1>주문 완료</h1>
      <div className="section">
        <p style={{ color: "var(--text-h)" }}>
          주문이 접수되었어요. 결제 금액 <Price amount={finalPrice} />
        </p>
      </div>
      <button className="pay" onClick={onBack}>
        주문서로 돌아가기
      </button>
    </div>
  );
}
