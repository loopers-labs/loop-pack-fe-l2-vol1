import { type ReactNode } from 'react';

import { Header } from '@/widgets/header';

import '../week-05-layout.css';

/**
 * 커머스 공통 레이아웃. Header를 한 곳에서만 렌더해 홈, 목록 간 중복을 제거한다.
 *
 * Header 는 `<header>`·`<nav>` 를 이미 갖고 있으므로, 본문을 `<main>` 으로 감싸
 * 탐색과 주요 콘텐츠의 경계가 마크업에서 드러나게 한다.
 */
export default function ShopLayout({ children }: { children: ReactNode }) {
  return (
    <div className="week05-page">
      <Header />
      <main>{children}</main>
    </div>
  );
}
