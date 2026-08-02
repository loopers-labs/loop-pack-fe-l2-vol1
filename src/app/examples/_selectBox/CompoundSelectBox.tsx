'use client';

import { useState } from 'react';
import { Select } from '@/shared/ui/select';
import type { SelectOption } from '@/shared/ui/select/types';

const paymentOptions: SelectOption[] = [
  { id: 'card', label: '카드 결제' },
  { id: 'transfer', label: '계좌 이체' },
  { id: 'point', label: '포인트 결제', disabled: true },
];

export function CompoundSelectBox() {
  const [selected, setSelected] = useState<SelectOption | null>(null);

  return (
    <Select options={paymentOptions} value={selected} onChange={setSelected}>
      <Select.Trigger>
        <Select.Value placeholder="결제 수단 선택" />
      </Select.Trigger>
      <Select.Content />
    </Select>
  );
}
