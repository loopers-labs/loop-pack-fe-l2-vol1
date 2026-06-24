import { MEMBER } from '../data';
import { SectionContainer } from './container';

export const PointSection = ({
  usePoint,
  onToggleCheckbox,
  pointInput,
  onInputChange,
}: {
  usePoint: boolean;
  onToggleCheckbox: (e: React.ChangeEvent<HTMLInputElement>) => void;
  pointInput: number;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) => {
  const member = MEMBER;
  return (
    <SectionContainer title="적립금">
      <label>
        <input type="checkbox" checked={usePoint} onChange={onToggleCheckbox} />
        적립금 사용 (보유 {member.point.toLocaleString()}P)
      </label>
      {usePoint ? <input type="number" value={pointInput} onChange={onInputChange} /> : null}
    </SectionContainer>
  );
};
