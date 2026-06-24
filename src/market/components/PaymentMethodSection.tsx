import type { PaymentMethod } from '../types';
import { SectionContainer } from './container';

const PAYMENT_METHODS: PaymentMethod[] = ['card', 'transfer', 'kakao'];
const PAYMENT_LABEL: Record<PaymentMethod, string> = {
  card: '신용/체크카드',
  transfer: '계좌이체',
  kakao: '카카오페이',
};

export const PaymentMethodSection = ({
  payment,
  onPaymentMethodChange,
}: {
  payment: PaymentMethod;
  onPaymentMethodChange: (m: PaymentMethod) => void;
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
