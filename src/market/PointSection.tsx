import { useState } from 'react';

import { MEMBER } from './data';

type PointSectionProps = {
  pointInput: number;
  onChangePointInput: (amount: number) => void;
};

export function PointSection({
  pointInput,
  onChangePointInput,
}: PointSectionProps) {
  const [usePoint, setUsePoint] = useState(pointInput > 0);

  const handleToggleUse = (use: boolean) => {
    setUsePoint(use);
    if (!use) onChangePointInput(0);
  };

  return (
    <>
      <label>
        <input
          type="checkbox"
          checked={usePoint}
          onChange={(e) => handleToggleUse(e.target.checked)}
        />
        적립금 사용 (보유 {MEMBER.point.toLocaleString()}P)
      </label>
      {usePoint ? (
        <input
          type="number"
          value={pointInput}
          onChange={(e) => onChangePointInput(Number(e.target.value))}
        />
      ) : null}
    </>
  );
}
