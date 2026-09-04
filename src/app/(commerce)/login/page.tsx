import type { Metadata } from 'next';
import { LoginPage } from '@/_pages/login/ui/LoginPage';
import { resolveNextPath } from '@/features/login/model/resolveNextPath';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export const metadata: Metadata = { title: '로그인' };

// `next`는 서버에서 한 번 검증해 화면에 넘긴다 — 폼은 검증된 값만 안다 (RFC D4).
export default async function Page({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { next } = await searchParams;
  return <LoginPage redirectTo={resolveNextPath(next)} />;
}
