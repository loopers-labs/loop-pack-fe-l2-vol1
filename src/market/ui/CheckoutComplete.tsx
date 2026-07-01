import { CheckoutContainer } from '../shared/ui/container';
import { Price } from './Price';

export const CheckoutComplete = ({
  finalPrice,
  onCheckoutButtonClick,
}: {
  finalPrice: number;
  onCheckoutButtonClick: () => void;
}) => {
  return (
    <CheckoutContainer title="주문 완료">
      <div className="section">
        <p style={{ color: 'var(--text-h)' }}>
          주문이 접수되었어요. 결제 금액 <Price value={finalPrice} />
        </p>
      </div>
      <button className="pay" onClick={onCheckoutButtonClick}>
        주문서로 돌아가기
      </button>
    </CheckoutContainer>
  );
};
