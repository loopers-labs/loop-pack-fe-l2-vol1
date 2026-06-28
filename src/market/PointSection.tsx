import { MEMBER } from './data';

interface PointSectionProps {
  usePoint: boolean;
  pointInput: number;
  onChangeUsePoint: (next: boolean) => void;
  onChangePointInput: (next: number) => void;
}

export function PointSection({ usePoint, pointInput, onChangeUsePoint, onChangePointInput }: PointSectionProps) {
  return (
    <div className="section">
      <h2>적립금</h2>
      <label>
        <input type="checkbox" checked={usePoint} onChange={(e) => onChangeUsePoint(e.target.checked)} />
        적립금 사용 (보유 {MEMBER.point.toLocaleString()}P)
      </label>
      {usePoint ? <input type="number" min={0} max={MEMBER.point} value={pointInput} onChange={(e) => onChangePointInput(Math.max(0, Number(e.target.value)))} /> : null}
    </div>
  );
}
