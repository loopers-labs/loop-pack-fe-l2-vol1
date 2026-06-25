import { forwardRef, useState, useImperativeHandle } from 'react';
import { Section } from '@/common/components/Section.tsx';

export type DeliveryMemoRef = {
  getValue: () => string;
};

export const DeliveryMemoSection = forwardRef<DeliveryMemoRef>(
  function DeliveryMemoSection(_, ref) {
    const [memo, setMemo] = useState('');

    useImperativeHandle(ref, () => ({ getValue: () => memo }));

    return (
      <Section title={'배송 요청사항'}>
        <textarea
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="배송 시 요청사항 (예: 부재 시 문 앞에 두세요)"
        />
      </Section>
    );
  },
);
