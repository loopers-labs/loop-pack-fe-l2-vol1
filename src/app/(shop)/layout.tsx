import { type ReactNode } from 'react';

import '../week-05-layout.css';
import { Header } from './_components/Header';

/**
 * 커머스 공통 레이아웃. Header를 한 곳에서만 렌더해 홈, 목록 간 중복을 제거한다.
 */
export default function ShopLayout({ children }: { children: ReactNode }) {
  return (
    <div className="week05-page">
      <Header />
      {children}
    </div>
  );
}
