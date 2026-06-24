import { useState } from "react";

export default function PointSection({
  memberPoint,
  pointInput,
  onChangePointInput,
}: {
  memberPoint: number;
  pointInput: number;
  onChangePointInput: (points: number) => void;
}) {
  const [usePoint, setUsePoint] = useState(false);

  const handleToggleUsePoint = (use: boolean) => {
    setUsePoint(use);
    onChangePointInput(use ? pointInput : 0);
  };

  const handleChangePointInput = (points: number) => {
    onChangePointInput(usePoint ? points : 0);
  };

  return (
    <div className="section">
      <h2>적립금</h2>
      <label>
        <input
          type="checkbox"
          checked={usePoint}
          onChange={(e) => handleToggleUsePoint(e.target.checked)}
        />
        적립금 사용 (보유 {memberPoint.toLocaleString()}P)
      </label>
      {usePoint ? (
        <input
          type="number"
          value={pointInput}
          onChange={(e) => handleChangePointInput(Number(e.target.value))}
        />
      ) : null}
    </div>
  );
}
