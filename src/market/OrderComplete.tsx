import { SectionCard } from './SectionCard';
import { getOrderAmount } from './getOrderAmount';
import type { CheckoutState } from './types';

type OrderCompleteProps = {
  checkoutForm: CheckoutState;
  onBack: () => void;
};

export function OrderComplete({ checkoutForm, onBack }: OrderCompleteProps) {
  const { finalPrice } = getOrderAmount(checkoutForm);

  return (
    <div className="checkout">
      <h1>주문 완료</h1>
      <SectionCard>
        <p style={{ color: 'var(--text-h)' }}>
          주문이 접수되었어요. 결제 금액 {finalPrice.toLocaleString()}원
        </p>
      </SectionCard>
      <button className="pay" onClick={onBack}>
        주문서로 돌아가기
      </button>
    </div>
  );
}
