type Props = {
  usePoint: boolean;
  pointInput: number;
  availablePoint: number;
  onToggleUse: (use: boolean) => void;
  onChangePointInput: (amount: number) => void;
};

export function PointSection({
  usePoint,
  pointInput,
  availablePoint,
  onToggleUse,
  onChangePointInput,
}: Props) {
  return (
    <div className="section">
      <h2>적립금</h2>
      <label>
        <input
          type="checkbox"
          checked={usePoint}
          onChange={(e) => onToggleUse(e.target.checked)}
        />
        적립금 사용 (보유 {availablePoint.toLocaleString()}P)
      </label>
      {usePoint ? (
        <input
          type="number"
          value={pointInput}
          onChange={(e) => onChangePointInput(Number(e.target.value))}
        />
      ) : null}
    </div>
  );
}
