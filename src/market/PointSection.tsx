import { MEMBER } from './data';

type PointSectionProps = {
  usePoint: boolean;
  pointInput: number;
  onChangeUsePoint: (use: boolean) => void;
  onChangePointInput: (point: number) => void;
};

export function PointSection({
  usePoint,
  pointInput,
  onChangeUsePoint,
  onChangePointInput,
}: PointSectionProps) {
  return (
    <>
      <label>
        <input
          type="checkbox"
          checked={usePoint}
          onChange={(e) => onChangeUsePoint(e.target.checked)}
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
