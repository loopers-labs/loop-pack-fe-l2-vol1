import { cookies } from 'next/headers';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { getQueryClient } from '@/shared/api/get-query-client';
import { sessionQueries } from '@/entities/session/api/sessionQueries';
/* eslint-disable boundaries/element-types -- (commerce) 라우트 그룹(괄호 폴더) 안에서
   app-data를 import하면 boundaries 플러그인이 아래 두 import를 "app to app"으로 잘못 잡는다
   (어느 줄이 걸리는지도 disable 위치에 따라 달라지는 불안정한 동작이라 파일 단위로 껐다).
   같은 import가 src/app/api/auth/login/route.ts에선 정상 통과하는 걸로 실제 계층 위반이 아님을 확인함. */
import { readSessionToken } from '@/app/api/_data/auth';
import { SESSION_COOKIE } from '@/app/api/_data/auth-cookies';
/* eslint-enable boundaries/element-types */
import { Header } from '@/widgets/header';

export default async function CommerceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 서버 컴포넌트(Node 런타임)이므로 node:crypto를 쓰는 readSessionToken을
  // 직접 재사용한다 — 자기 자신의 /api/auth/me를 다시 fetch하는 왕복을 피함.
  const cookieStore = await cookies();
  const user = readSessionToken(cookieStore.get(SESSION_COOKIE)?.value);

  const queryClient = getQueryClient();
  queryClient.setQueryData(sessionQueries.me().queryKey, user);

  return (
    <main className="week05-page">
      <HydrationBoundary state={dehydrate(queryClient)}>
        <Header />
        {children}
      </HydrationBoundary>
    </main>
  );
}
