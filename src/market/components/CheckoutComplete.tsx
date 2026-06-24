import { CheckoutContainer } from './container';

export const CheckoutComplete = ({
  itemTotal,
  shippingFee,
  couponDiscount,
  pointDiscount,
  onCheckoutButtonClick,
}: {
  itemTotal: number;
  shippingFee: number;
  couponDiscount: number;
  pointDiscount: number;
  onCheckoutButtonClick: () => void;
}) => {
  const finalPrice = itemTotal + shippingFee - couponDiscount - pointDiscount;

  return (
    <CheckoutContainer title="주문 완료">
      <div className="section">
        <p style={{ color: 'var(--text-h)' }}>
          주문이 접수되었어요. 결제 금액 {finalPrice.toLocaleString()}원
        </p>
      </div>
      <button className="pay" onClick={onCheckoutButtonClick}>
        주문서로 돌아가기
      </button>
    </CheckoutContainer>
  );
};
