import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { LoginContent } from '@/_pages/login/ui/LoginContent';
import { getCurrentUser } from '@/app/_lib/session';
import { getLoginFrom } from '@/shared/lib/loginFrom';
import { getSafeReturnTo } from '@/shared/lib/safeReturnTo';

export const metadata: Metadata = {
  title: '로그인',
  description: '주문과 주문 내역을 이용하려면 로그인하세요.',
};

interface LoginPageProps {
  searchParams: Promise<{ returnTo?: string; from?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { returnTo: requestedReturnTo, from: requestedFrom } =
    await searchParams;
  const returnTo = getSafeReturnTo(requestedReturnTo);
  const loginFrom = getLoginFrom(requestedFrom);
  const user = await getCurrentUser();

  if (user) {
    redirect(returnTo);
  }

  return <LoginContent returnTo={returnTo} loginFrom={loginFrom} />;
}
