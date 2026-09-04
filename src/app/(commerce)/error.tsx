'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { sessionQueries } from '@/entities/session';
import { UnauthorizedError } from '@/shared/api/errors';

// (commerce) 세그먼트의 예상 밖 오류 fallback — 렌더링 오류와
// throwOnError로 전파된 응답 계약 위반, 그리고 401(UnauthorizedError)이 여기로 온다.
// (commerce) layout 안쪽 경계라 헤더는 생존한다.
//
// 세션 만료는 여기 한 곳에서만 처리한다 (9주차 RFC D5). 화면마다 401을 검사하지 않는다.
export default function CommerceError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const queryClient = useQueryClient();
  const pathname = usePathname();

  // reset()만으로는 복구되지 않는다 — TanStack이 에러를 캐시에 들고 있어
  // 재마운트한 useQuery가 캐시된 에러를 throwOnError로 즉시 다시 던진다(재현으로 확인).
  // 에러 상태의 쿼리를 초기화한 뒤 세그먼트를 리셋해야 재조회가 일어난다.
  const retry = () => {
    void queryClient.resetQueries({
      predicate: (query) => query.state.status === 'error',
    });
    reset();
  };

  if (error instanceof UnauthorizedError) {
    // 서버는 이 쿠키를 더 인정하지 않는다 — 헤더도 로그아웃 상태로 맞춘다.
    queryClient.setQueryData(sessionQueries.me().queryKey, null);
    const next = encodeURIComponent(pathname);
    return (
      <div role="alert">
        <p>세션이 만료됐어요. 다시 로그인해주세요.</p>
        <Link href={`/login?next=${next}`}>다시 로그인</Link>
      </div>
    );
  }

  return (
    <div role="alert">
      <p>화면을 표시하지 못했어요.</p>
      <p>{error.message}</p>
      <button type="button" onClick={retry}>
        다시 시도
      </button>
    </div>
  );
}
