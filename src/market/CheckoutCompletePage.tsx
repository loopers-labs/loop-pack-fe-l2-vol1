import { getPriceText } from '@/utils.ts';

type CheckoutCompleteProps = {
  finalPrice: number;
  goToCheckoutPage: () => void;
};
export function CheckoutCompletePage({ finalPrice, goToCheckoutPage }: CheckoutCompleteProps) {
  return (
    <div className="checkout">
      <h1>주문 완료</h1>
      <div className="section">
        <p style={{ color: 'var(--text-h)' }}>
          주문이 접수되었어요. 결제 금액 {getPriceText(finalPrice)}
        </p>
      </div>
      <button className="pay" onClick={goToCheckoutPage}>
        주문서로 돌아가기
      </button>
    </div>
  );
}
