'use client';

import { useQueryClient } from '@tanstack/react-query';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

import { orderQueries } from '@/entities/order';
import { useSessionActions } from '@/entities/session';
import { buildLoginUrl } from '@/features/auth';
import { isUnauthorizedError } from '@/shared/api-client';

/**
 * 조회 실패는 각 화면이 인라인으로 처리하므로 여기는 예상 밖 렌더링 오류와 React Query가 던져 올린 401(세션 만료) 전담이다.
 * reset만으로는 서버 컴포넌트를 다시 렌더하지 않아 unstable_retry(reset + refresh)를 쓴다.
 */
export default function CommerceError({
  error,
  unstable_retry: retry,
}: {
  error: Error;
  unstable_retry: () => void;
}) {
  const queryClient = useQueryClient();

  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const returnPath = search ? `${pathname}?${search}` : pathname;

  const { clearUser } = useSessionActions();

  const sessionExpired = isUnauthorizedError(error);

  // 쿠키는 남아 있어도 API가 401을 주면 UI 사용자만 비우고 직전 위치를 next에 실어 재로그인을 받는다.
  useEffect(() => {
    if (!sessionExpired) return;

    clearUser();
    queryClient.removeQueries({ queryKey: orderQueries.all() });
    router.replace(buildLoginUrl(returnPath, 'expired'));
  }, [sessionExpired, clearUser, queryClient, router, returnPath]);

  if (sessionExpired) {
    return <p role="status">세션이 만료되어 로그인 화면으로 이동합니다.</p>;
  }

  return (
    <section className="week05-error" role="alert">
      <h1>화면을 표시하지 못했습니다</h1>
      <p>예상하지 못한 문제가 발생했습니다. 다시 시도해주세요.</p>
      <button type="button" onClick={retry}>
        다시 시도
      </button>
    </section>
  );
}
