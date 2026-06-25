import { useState } from 'react';
import type { PaymentMethod } from '@/market/types/payment.types';
import { Section } from '@/common/components/Section.tsx';
import { Radio } from '@/common/components/Radio.tsx';

const PAYMENT_LABEL: Record<PaymentMethod, string> = {
  card: '신용/체크카드',
  transfer: '계좌이체',
  kakao: '카카오페이',
};

const PAYMENT_METHODS: PaymentMethod[] = ['card', 'transfer', 'kakao'];

// 결제수단은 가격 계산이나 다른 섹션에 영향을 주지 않아 이 섹션 내부에서만 관리한다.
export function PaymentMethodSection() {
  const [payment, setPayment] = useState<PaymentMethod>('card');

  return (
    <Section title="결제수단">
      {PAYMENT_METHODS.map((m) => (
        <Radio key={m} checked={payment === m} onChange={() => setPayment(m)}>
          {PAYMENT_LABEL[m]}
        </Radio>
      ))}
    </Section>
  );
}
