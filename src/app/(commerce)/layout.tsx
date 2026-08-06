import type { ReactNode } from 'react';
import { SiteHeader } from '../SiteHeader';

// 커머스 화면의 공통 크롬 — 헤더는 여기서 1회 렌더한다.
// 라우트 그룹이라 URL은 그대로이고, 데모 라우트(dialog-demo·select-demo)에는 적용되지 않는다.
export default function CommerceLayout({ children }: { children: ReactNode }) {
  return (
    <div className="week05-page">
      <SiteHeader />
      {children}
    </div>
  );
}
