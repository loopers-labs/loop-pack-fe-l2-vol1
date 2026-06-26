import type { Dispatch, SetStateAction } from 'react';
import { SectionContainer } from '../shared/ui/container';

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value.replace(/,/g, '')) || 0;
    onInputChange(value);
  };

  return (
    <SectionContainer title="적립금">
      <label>
        <input type="checkbox" checked={usePoint} onChange={onToggleCheckbox} />
        적립금 사용 (보유 {availablePoint.toLocaleString()}P)
      </label>
      {usePoint ? (
        <input
          id="point"
          // type을 text로 변경하여 가격앞에 0이오는 경우를 방지
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          // value에도 toLocaleString()을 적용하여 가독성 향상
          value={pointValue.toLocaleString()}
          onChange={handleInputChange}
          onKeyDown={(e) => {
            if (
              !/[0-9]/.test(e.key) &&
              !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key)
            ) {
              e.preventDefault();
            }
          }}
        />
      ) : null}
    </SectionContainer>
  );
};
