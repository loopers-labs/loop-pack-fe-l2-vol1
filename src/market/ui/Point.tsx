import { useState } from 'react';
import { SectionContainer } from '../shared/ui/container';
import { PriceInput } from './PriceInput';

export const Point = ({
  pointInput,
  availablePoint,
  onInputChange,
}: {
  pointInput: number;
  availablePoint: number;
  onInputChange: (value: number) => void;
}) => {
  const [checked, setChecked] = useState(true);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value.replace(/,/g, ''), 10) || 0;
    onInputChange(Math.min(value, availablePoint));
  };

  return (
    <SectionContainer title="적립금">
      <label>
        <input type="checkbox" checked={checked} onChange={() => setChecked(!checked)} />
        적립금 사용 (보유 {availablePoint.toLocaleString()}P)
      </label>
      {checked ? <PriceInput price={pointInput} onValueChange={handleInputChange} /> : null}
    </SectionContainer>
  );
};
