/** ⑨ Context 전에 composition: CheckoutPage에서 분리, props로 값 전달 (Context 불필요) */
export const OrderCompleteStep = ({
  finalPrice,
  memo,
  onBack,
}: {
  finalPrice: number
  memo: string
  onBack: () => void
}) => {
  return (
    <div className="checkout">
      <h1>주문 완료</h1>
      <div className="section">
        <p style={{ color: 'var(--text-h)' }}>
          주문이 접수되었어요. 결제 금액 {finalPrice.toLocaleString()}원
        </p>
        {/* ② 구현 vs 조합: 상태 끌어올림 후 memo 값이 전달되는지 확인용 */}
        {memo && <p>배송 요청사항: {memo}</p>}
      </div>
      <button className="pay" onClick={onBack}>
        주문서로 돌아가기
      </button>
    </div>
  )
}
