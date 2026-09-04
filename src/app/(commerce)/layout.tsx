import type { ReactNode } from 'react';
import { cookies } from 'next/headers';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { readSessionToken } from '@/app/api/_data/auth';
import { SESSION_COOKIE } from '@/app/api/_data/auth-cookies';
import { sessionQueries } from '@/entities/session';
import { getQueryClient } from '../get-query-client';
import { SiteHeader } from '../SiteHeader';

// 커머스 화면의 공통 크롬 — 헤더는 여기서 1회 렌더한다.
// 라우트 그룹이라 URL은 그대로이고, 데모 라우트(dialog-demo·select-demo)에는 적용되지 않는다.
//
// 세션은 여기서 읽는다 (RFC D1): 쿠키를 서버에서 검증해 세션 query에 미리 넣어주므로
// JS 실행 전 초기 HTML에 로그인 상태가 있다. HTTP를 돌지 않고 readSessionToken을 직접 부른다 —
// 같은 프로세스 안에서 자기 Route Handler를 호출할 이유가 없다.
// 비용: cookies()를 읽으면 이 트리는 요청 시점 렌더링이 된다. 홈(force-dynamic)·목록(searchParams)은
// 이미 동적이라 정적 생성 범위는 바뀌지 않는다 — build 출력의 ○/ƒ로 확인한다.
export default async function CommerceLayout({
  children,
}: {
  children: ReactNode;
}) {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const user = readSessionToken(token);

  const queryClient = getQueryClient();
  queryClient.setQueryData(sessionQueries.me().queryKey, user);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div className="week05-page">
        <SiteHeader />
        {children}
      </div>
    </HydrationBoundary>
  );
}
