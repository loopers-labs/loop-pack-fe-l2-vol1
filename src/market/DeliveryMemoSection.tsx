import { useState } from 'react';
import { DeliveryMemo } from './DeliveryMemo';

export function DeliveryMemoSection() {
  const [memo, setMemo] = useState('');
  return (
    <div className="section">
      <h2>배송 요청사항</h2>
      <DeliveryMemo memo={memo} onChangeMemo={setMemo} />
    </div>
  );
}
