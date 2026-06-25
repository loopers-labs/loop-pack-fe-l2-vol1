import { useState } from 'react';
import { Section } from '@/common/components/Section.tsx';
import { Checkbox } from '@/common/components/Checkbox.tsx';
import { getPriceText } from '@/utils.ts';

type PointSectionProps = {
  /** 보유 적립금 */
  availablePoint: number;
  /** 쿠폰·등급할인 적용 후 포인트로 차감 가능한 최대 금액 */
  payableAmount: number;
  /** 적립금 할인 금액 변경 시 호출 */
  onPointDiscountChange: (discount: number) => void;
};

export function PointSection({
  availablePoint,
  payableAmount,
  onPointDiscountChange,
}: PointSectionProps) {
  const [usePoint, setUsePoint] = useState<boolean>(false);
  const [pointInput, setPointInput] = useState<number>(0);

  //pointInput: 사용자가 입력한 값
  //availablePoint: 보유 적립금 초과 방지
  //payableAmount: 쿠폰 적용 후 상품금액 초과 방지
  const effectivePointInput = Math.min(pointInput, availablePoint, payableAmount);

  const handleUsePointChange = (checked: boolean) => {
    setUsePoint(checked);
    onPointDiscountChange(checked ? effectivePointInput : 0);
  };

  const handlePointInputChange = (value: number) => {
    setPointInput(value);
    onPointDiscountChange(usePoint ? Math.min(value, availablePoint, payableAmount) : 0);
  };

  return (
    <Section title="적립금">
      <Checkbox
        checked={usePoint}
        onChange={(e) => handleUsePointChange(e.target.checked)}
        caption={`적립금 사용 (보유 ${getPriceText(availablePoint, 'P')})`}
      />
      {usePoint ? (
        <input
          type="text"
          inputMode="numeric"
          value={effectivePointInput}
          onChange={(e) => {
            const digits = e.target.value.replace(/\D/g, '');
            handlePointInputChange(digits === '' ? 0 : Number(digits));
          }}
        />
      ) : null}
    </Section>
  );
}
