import { useCheckout } from './context'

interface OrderCompleteProps {
  onBack: () => void
}

// 주문 완료 화면 — 결제 금액은 Context 에서 읽고, 화면 전환만 부모에 위임한다.
export function OrderComplete({ onBack }: OrderCompleteProps) {
  const { summary } = useCheckout()

  return (
    <div className="checkout">
      <h1>주문 완료</h1>
      <div className="section">
        <p style={{ color: 'var(--text-h)' }}>
          주문이 접수되었어요. 결제 금액 {summary.finalPrice.toLocaleString()}원
        </p>
      </div>
      <button className="pay" onClick={onBack}>
        주문서로 돌아가기
      </button>
    </div>
  )
}
