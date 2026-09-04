'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { authQueries } from '@/entities/auth';

// 로그아웃은 헤더(Header.tsx)에 있다. 세션 만료 안내는 로그인 화면(LoginNotice)이 맡는다.
export default function MyPage() {
  // RootLayout이 서버에서 채워 넘긴 세션 캐시를 읽는다. GET /api/auth/me 응답이 이 화면의 내용 전부다.
  const { data: user } = useQuery(authQueries.me());

  // 보호 경로라 proxy.ts가 세션 쿠키를 검증하고 통과시킨 뒤에만 이 화면이 그려진다.
  // 그래도 세션이 그 사이 사라졌다면(만료 시나리오) 계정 정보를 지어내지 않고 로그인으로 안내한다.
  if (!user) {
    return (
      <main className="page-container">
        <h1>마이페이지</h1>
        <p role="status">로그인 정보를 확인할 수 없습니다.</p>
        <Link href="/login">로그인하러 가기</Link>
      </main>
    );
  }

  return (
    <main className="page-container">
      <h1>마이페이지</h1>

      <section className="content-section">
        <h2 className="visually-hidden">계정 정보</h2>
        <div className="account-box">
          <strong className="account-name">{user.name} 님</strong>
          {/* 계정 식별용 표시라 mailto 링크로 만들지 않는다 */}
          <span className="account-email">{user.email}</span>
        </div>
      </section>

      {/* 주문 내역으로 가는 유일한 진입점이라 링크만 남긴다. 건수 요약은 두지 않는다 —
          같은 GET /api/orders 응답을 주문 내역 화면이 이미 온전히 보여준다. */}
      <section className="content-section">
        <Link href="/orders">주문 내역 보러 가기</Link>
      </section>
    </main>
  );
}
