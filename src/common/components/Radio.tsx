import type { InputHTMLAttributes, ReactNode } from 'react';

type RadioProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  /** 라디오 옆에 표시할 콘텐츠 */
  children?: ReactNode;
  /** 래퍼 label에 적용할 className (input 자체의 className과는 별도) */
  labelClassName?: string;
};

export function Radio({ children, labelClassName, ...inputProps }: RadioProps) {
  return (
    <label className={labelClassName}>
      <input type="radio" {...inputProps} />
      {children}
    </label>
  );
}
