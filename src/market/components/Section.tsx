import type { ReactNode } from 'react';

export interface SectionProps {
  header?: ReactNode;
  children: ReactNode;
}

/**
 * 페이지 섹션 래퍼. 제목/액션은 `header` slot, 본문은 `children`.
 *
 * - 원인: `.section` 래퍼 div가 여러 섹션에 반복되고 제목 영역 스타일이 제각각 → 결과: 래퍼를 공통화하고 제목을 `header` 슬롯으로 열어 추후 확장성을 확보.
 */
export const Section = ({ header, children }: SectionProps) => {
  return (
    <div className="section">
      {header}
      {children}
    </div>
  );
};

export default Section;
