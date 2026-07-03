import { formatWon } from "./format";

type Props = {
  finalPrice: number;
  onBack: () => void;
};

// 주문 완료 화면 — 결제 금액을 표시하고 주문서로 돌아가는 동작만 담당한다.
export function OrderComplete({ finalPrice, onBack }: Props) {
  return (
    <div className="checkout">
      <h1>주문 완료</h1>
      <div className="section">
        <p style={{ color: "var(--text-h)" }}>
          주문이 접수되었어요. 결제 금액 {formatWon(finalPrice)}
        </p>
      </div>
      <button className="pay" onClick={onBack}>
        주문서로 돌아가기
      </button>
    </div>
  );
}
