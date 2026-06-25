import type { ReactNode } from 'react';

type SectionProps = {
  /** 섹션 제목 */
  title?: string;
  /** 제목 옆(우측)에 표시할 콘텐츠 (버튼 등) */
  rightSlot?: ReactNode;
  /** 섹션 내부에 렌더링할 콘텐츠 */
  children: ReactNode;
};

export function Section({ title, rightSlot, children }: SectionProps) {
  return (
    <div className="section">
      <div className="row between">
        <h2>{title}</h2>
        {rightSlot}
      </div>
      {children}
    </div>
  );
}
