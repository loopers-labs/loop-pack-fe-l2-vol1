import type { Dispatch, SetStateAction } from 'react';
import { SectionContainer } from '../shared/ui/container';
import { PriceInput } from './PriceInput';

export const Point = ({
  usePoint,
  pointInput,
  availablePoint,
  onToggleCheckbox,
  onInputChange,
}: {
  usePoint: boolean;
  pointInput: number;
  availablePoint: number;
  onToggleCheckbox: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onInputChange: Dispatch<SetStateAction<number>>;
}) => {
  // 입력 금액이 보유 포인트보다 높을 경우 자동으로 보유 포인트가 입력되도록 설정
  const pointValue = pointInput > availablePoint ? availablePoint : pointInput;

  return (
    <SectionContainer title="적립금">
      <label>
        <input type="checkbox" checked={usePoint} onChange={onToggleCheckbox} />
        적립금 사용 (보유 {availablePoint.toLocaleString()}P)
      </label>
      {usePoint ? <PriceInput price={pointValue} callback={onInputChange} /> : null}
    </SectionContainer>
  );
};
