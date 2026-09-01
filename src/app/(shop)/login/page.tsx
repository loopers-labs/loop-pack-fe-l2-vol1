import { LoginPage } from '@/_pages/login/ui/LoginPage';

type Props = {
  searchParams: Promise<{ reason?: string; returnTo?: string }>;
};

export const metadata = { title: '로그인' };

export default async function LoginRoute({ searchParams }: Props) {
  const { reason, returnTo } = await searchParams;
  return <LoginPage reason={reason} returnTo={returnTo} />;
}
