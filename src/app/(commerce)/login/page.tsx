import type { Metadata } from 'next';
import { LoginPage } from '@/_pages/login/ui/LoginPage';

export const metadata: Metadata = {
  title: '로그인',
};

type Props = {
  searchParams: Promise<{ redirect?: string; reason?: string }>;
};

export default async function Page({ searchParams }: Props) {
  const params = await searchParams;
  return (
    <LoginPage
      redirect={params.redirect ?? null}
      reason={params.reason ?? null}
    />
  );
}
