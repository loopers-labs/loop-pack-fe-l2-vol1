import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { LoginPage } from '@/_pages/login/ui/LoginPage';
import { getSafeRedirectPath } from '@/features/auth-login/model/redirect';
/* eslint-disable boundaries/element-types -- (commerce) 라우트 그룹(괄호 폴더) 안에서
   app-data를 import하면 boundaries 플러그인이 "app to app"으로 잘못 잡는다
   (src/app/(commerce)/layout.tsx에도 같은 이유로 있는 예외). 같은 import가
   src/app/api/auth/login/route.ts에선 정상 통과하는 걸로 실제 계층 위반이 아님을 확인함. */
import { readSessionToken } from '@/app/api/_data/auth';
import { SESSION_COOKIE } from '@/app/api/_data/auth-cookies';
/* eslint-enable boundaries/element-types */

export const metadata: Metadata = {
  title: '로그인',
};

type Props = {
  searchParams: Promise<{ redirect?: string; reason?: string }>;
};

export default async function Page({ searchParams }: Props) {
  const params = await searchParams;

  // 이미 로그인한 사람이 /login에 직접 들어오면 폼을 보여줄 필요가 없다.
  // 서버에서 바로 리다이렉트시켜 폼이 잠깐이라도 보이는 깜빡임을 없앤다.
  const cookieStore = await cookies();
  const user = readSessionToken(cookieStore.get(SESSION_COOKIE)?.value);
  if (user) {
    redirect(getSafeRedirectPath(params.redirect ?? null));
  }

  return (
    <LoginPage
      redirect={params.redirect ?? null}
      reason={params.reason ?? null}
    />
  );
}
