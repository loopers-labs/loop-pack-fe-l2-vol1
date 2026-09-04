'use client';

import { useSearchParams } from 'next/navigation';

// reason은 "왜 여기 왔는지" 안내이지 로그인 시도 결과가 아니다 — LoginForm의 관심사와
// 분리해 둔다(01-auth-guard-design.md 1번 결정). 원인을 단정하지 않고 다음 행동만 알린다.
export default function LoginNotice() {
  const searchParams = useSearchParams();
  if (searchParams.get('reason') !== 'expired') return null;

  return <p role="status">세션이 끊어졌어요. 다시 로그인해 주세요.</p>;
}
