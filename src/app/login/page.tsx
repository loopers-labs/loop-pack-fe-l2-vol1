import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { LoginContent } from '@/_pages/login/ui/LoginContent';
import { getCurrentUser } from '@/app/_lib/session';
import {
  LOGIN_SOURCE_SEARCH_PARAM,
  type LoginSourceSearchParams,
} from '@/features/auth/lib/authNavigation';
import { getLoginEntrySource } from '@/shared/lib/loginEntrySource';
import { getSafeReturnTo } from '@/shared/lib/safeReturnTo';

export const metadata: Metadata = {
  title: '로그인',
  description: '주문과 주문 내역을 이용하려면 로그인하세요.',
};

interface LoginPageProps {
  searchParams: Promise<{ returnTo?: string } & LoginSourceSearchParams>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const requestedReturnTo = params.returnTo;
  const returnTo = getSafeReturnTo(requestedReturnTo);
  const loginSource = getLoginEntrySource(
    params[LOGIN_SOURCE_SEARCH_PARAM],
  );
  const user = await getCurrentUser();

  if (user) {
    redirect(returnTo);
  }

  return <LoginContent returnTo={returnTo} loginSource={loginSource} />;
}
