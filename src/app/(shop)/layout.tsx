import { type ReactNode } from 'react';

import { SESSION_COOKIE } from '@/app/api/_data/auth-cookies';
import { Header } from '@/widgets/header';
import { cookies } from 'next/headers';

import '../week-05-layout.css';

/**
 * 커머스 공통 레이아웃. Header를 한 곳에서만 렌더해 홈, 목록 간 중복을 제거한다.
 *
 * Header 는 `<header>`·`<nav>` 를 이미 갖고 있으므로, 본문을 `<main>` 으로 감싸
 * 탐색과 주요 콘텐츠의 경계가 마크업에서 드러나게 한다.
 *
 * NOTE: cookies() 호출로 이 레이아웃이 동적 렌더링 경계가 된다.
 * 요청마다 서버에서 다시 실행되므로 세션 쿠키 상태가 초기 HTML 에 반영된다.
 * JavaScript 실행 전에도 헤더가 로그인 상태를 보여줄 수 있는 이유다.
 */
export default async function ShopLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies();
  const isLoggedIn = cookieStore.has(SESSION_COOKIE);

  return (
    <div className="week05-page">
      <Header isLoggedIn={isLoggedIn} />
      <main>{children}</main>
    </div>
  );
}
