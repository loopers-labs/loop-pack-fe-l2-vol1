import { forwardRef, useState, useImperativeHandle } from 'react';
import type { PaymentMethod } from '@/market/types/payment.types';
import { Section } from '@/common/components/Section.tsx';
import { Radio } from '@/common/components/Radio.tsx';

const PAYMENT_LABEL: Record<PaymentMethod, string> = {
  card: '신용/체크카드',
  transfer: '계좌이체',
  kakao: '카카오페이',
};

const PAYMENT_METHODS: PaymentMethod[] = ['card', 'transfer', 'kakao'];

export type PaymentMethodRef = {
  getValue: () => PaymentMethod;
};

export const PaymentMethodSection = forwardRef<PaymentMethodRef>(
  function PaymentMethodSection(_, ref) {
    const [payment, setPayment] = useState<PaymentMethod>('card');

    useImperativeHandle(ref, () => ({ getValue: () => payment }));

    return (
      <Section title="결제수단">
        {PAYMENT_METHODS.map((m) => (
          <Radio key={m} checked={payment === m} onChange={() => setPayment(m)}>
            {PAYMENT_LABEL[m]}
          </Radio>
        ))}
      </Section>
    );
  },
);
