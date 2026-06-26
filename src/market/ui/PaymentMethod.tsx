import type { PaymentMethod as PaymentMethodType } from '../shared/types/types';
import { SectionContainer } from '../shared/ui/container';

const PAYMENT_METHODS: PaymentMethodType[] = ['card', 'transfer', 'kakao'];
const PAYMENT_LABEL: Record<PaymentMethodType, string> = {
  card: '신용/체크카드',
  transfer: '계좌이체',
  kakao: '카카오페이',
};

export const PaymentMethod = ({
  payment,
  onPaymentMethodChange,
}: {
  payment: PaymentMethodType;
  onPaymentMethodChange: (m: PaymentMethodType) => void;
}) => {
  return (
    <SectionContainer title="결제수단">
      {PAYMENT_METHODS.map((m) => (
        <label key={m}>
          <input type="radio" checked={payment === m} onChange={() => onPaymentMethodChange(m)} />
          {PAYMENT_LABEL[m]}
        </label>
      ))}
    </SectionContainer>
  );
};
