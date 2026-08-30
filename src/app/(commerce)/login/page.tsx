import type { Metadata } from 'next';
import type { SearchParams } from 'nuqs/server';

import { LoginPage } from '@/_pages/login';

export const metadata: Metadata = { title: '로그인' };

export default function Login({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  return <LoginPage searchParams={searchParams} />;
}
