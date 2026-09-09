import { cookies } from 'next/headers';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { getQueryClient } from '@/shared/api/get-query-client';
import { sessionQueries } from '@/entities/session/api/sessionQueries';
/* eslint-disable boundaries/element-types -- (commerce) 라우트 그룹(괄호 폴더) 안에서
   app-data를 import하면 boundaries 플러그인이 아래 두 import를 "app to app"으로 잘못 잡는다
   (어느 줄이 걸리는지도 disable 위치에 따라 달라지는 불안정한 동작이라 파일 단위로 껐다).
   같은 import가 src/app/api/auth/login/route.ts에선 정상 통과하는 걸로 실제 계층 위반이 아님을 확인함. */
import { readSessionToken } from '@/app/api/_data/auth';
import { SCENARIO_COOKIE, SESSION_COOKIE } from '@/app/api/_data/auth-cookies';
/* eslint-enable boundaries/element-types */
import { Header } from '@/widgets/header';

export default async function CommerceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 서버 컴포넌트(Node 런타임)이므로 node:crypto를 쓰는 readSessionToken을
  // 직접 재사용한다 — 자기 자신의 /api/auth/me를 다시 fetch하는 왕복을 피함.
  //
  // scenario=expired일 땐 /api/auth/me, /api/orders가 토큰이 진짜 유효해도
  // 강제로 401을 준다(테스트용 시뮬레이션). readSessionToken은 이걸 모르고
  // 원시 토큰만 보므로, 여기서도 API와 같은 판단을 하도록 scenario를 같이 본다.
  // 안 맞추면 "세션 만료" 메시지가 뜬 화면에서 헤더는 계속 로그인 상태로 보이는
  // 모순이 생긴다(staleTime: Infinity라 클라이언트가 스스로 재검증하지도 않음).
  const cookieStore = await cookies();
  const scenario = cookieStore.get(SCENARIO_COOKIE)?.value;
  const user =
    scenario === 'expired'
      ? null
      : readSessionToken(cookieStore.get(SESSION_COOKIE)?.value);

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
