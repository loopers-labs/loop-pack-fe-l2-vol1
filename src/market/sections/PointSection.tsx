import { useState } from 'react';
import { Section } from '@/common/components/Section.tsx';
import { Checkbox } from '@/common/components/Checkbox.tsx';
import { getPriceText } from '@/utils.ts';

type PointSectionProps = {
  availablePoint: number;
  itemTotal: number;
  onPointDiscountChange: (discount: number) => void;
};

export function PointSection({
  availablePoint,
  itemTotal,
  onPointDiscountChange,
}: PointSectionProps) {
  const [usePoint, setUsePoint] = useState<boolean>(false);
  const [pointInput, setPointInput] = useState<number>(0);

  const reportDiscount = (nextUsePoint: boolean, nextPointInput: number) => {
    onPointDiscountChange(nextUsePoint ? Math.min(nextPointInput, availablePoint, itemTotal) : 0);
  };

  const handleUsePointChange = (checked: boolean) => {
    setUsePoint(checked);
    reportDiscount(checked, pointInput);
  };

  const handlePointInputChange = (value: number) => {
    const maximumAvailablePoint = Math.min(availablePoint, itemTotal);
    const next = Math.min(value, maximumAvailablePoint);
    setPointInput(next);
    reportDiscount(usePoint, next);
  };

  return (
    <Section title="적립금">
      <Checkbox
        checked={usePoint}
        onChange={(e) => handleUsePointChange(e.target.checked)}
        caption={`적립금 사용 (보유 ${getPriceText(availablePoint, 'P')})`}
      />
      {/* AI-generated */}
      {usePoint ? (
        <input
          type="text"
          inputMode="numeric"
          value={pointInput}
          onChange={(e) => {
            const digits = e.target.value.replace(/\D/g, '');
            handlePointInputChange(digits === '' ? 0 : Number(digits));
          }}
        />
      ) : null}
    </Section>
  );
}
