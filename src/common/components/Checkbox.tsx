import type { InputHTMLAttributes } from 'react';

type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  /** 체크박스 옆에 표시할 캡션 텍스트 */
  caption?: string;
  /** 래퍼 label에 적용할 className (input 자체의 className과는 별도) */
  labelClassName?: string;
};

export function Checkbox({ caption, labelClassName, ...inputProps }: CheckboxProps) {
  return (
    <label className={labelClassName}>
      <input type="checkbox" {...inputProps} />
      {caption}
    </label>
  );
}
