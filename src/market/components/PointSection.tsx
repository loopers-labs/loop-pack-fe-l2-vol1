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
  // 입력 금액이 보유 포인트보다 높을 경우 자동으로 보유 포인트가 입력되도록 설정
  const pointValue = pointInput > member.point ? member.point : pointInput;
  return (
    <SectionContainer title="적립금">
      <label>
        <input type="checkbox" checked={usePoint} onChange={onToggleCheckbox} />
        적립금 사용 (보유 {member.point.toLocaleString()}P)
      </label>
      {usePoint ? (
        <input
          id="point"
          // type을 text로 변경하여 가격앞에 0이오는 경우를 방지
          type="text"
          // value에도 toLocaleString()을 적용하여 가독성 향상
          value={pointValue.toLocaleString()}
          onChange={onInputChange}
        />
      ) : null}
    </SectionContainer>
  );
};
