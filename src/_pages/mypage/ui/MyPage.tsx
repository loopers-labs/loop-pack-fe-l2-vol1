'use client';

import { useSuspenseQuery } from '@tanstack/react-query';

import { mypageQueryOptions } from '../api/mypageQueries';

/**
 * 마이페이지. 서버에서 prefetch 된 캐시를 hydrate 받아 조회한다.
 * 로딩, 에러는 상위 MyPageBoundary 의 Suspense, ErrorBoundary 가 맡고,
 * 여기서는 데이터가 있는 성공 경로만 다룬다.
 */
export function MyPage() {
  const { data } = useSuspenseQuery(mypageQueryOptions.me());

  const { user } = data;

  return (
    <section className="week05-section">
      <h1>마이페이지</h1>

      <dl>
        <dt>이름</dt>
        <dd>{user.name}</dd>
        <dt>이메일</dt>
        <dd>{user.email}</dd>
      </dl>
    </section>
  );
}
