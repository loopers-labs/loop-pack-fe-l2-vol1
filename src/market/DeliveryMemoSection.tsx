import { DeliveryMemo } from './DeliveryMemo';

interface DeliveryMemoSectionProps {
  memo: string;
  onChangeMemo: (next: string) => void;
}

export function DeliveryMemoSection({ memo, onChangeMemo }: DeliveryMemoSectionProps) {
  return (
    <div className="section">
      <h2>배송 요청사항</h2>
      <DeliveryMemo memo={memo} onChangeMemo={onChangeMemo} />
    </div>
  );
}
