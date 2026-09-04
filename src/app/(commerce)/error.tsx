'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
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
  const searchParams = useSearchParams();
  const expired = error instanceof UnauthorizedError;

  // 캐시 쓰기는 커밋 이후에 한다 — 렌더 중에 쓰면 다른 컴포넌트(헤더)를 렌더 도중에 갱신하게 된다.
  useEffect(() => {
    if (expired) {
      queryClient.setQueryData(sessionQueries.me().queryKey, null);
    }
  }, [expired, queryClient]);

  // reset()만으로는 복구되지 않는다 — TanStack이 에러를 캐시에 들고 있어
  // 재마운트한 useQuery가 캐시된 에러를 throwOnError로 즉시 다시 던진다(재현으로 확인).
  // 에러 상태의 쿼리를 초기화한 뒤 세그먼트를 리셋해야 재조회가 일어난다.
  const retry = () => {
    void queryClient.resetQueries({
      predicate: (query) => query.state.status === 'error',
    });
    reset();
  };

  if (expired) {
    // 복원 경로는 proxy와 같은 모양으로 만든다 — pathname만 쓰면 /orders?page=2가 /orders로 죽는다.
    const query = searchParams.toString();
    const next = encodeURIComponent(query ? `${pathname}?${query}` : pathname);
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
