'use client';

import { useQueryClient } from '@tanstack/react-query';

// (commerce) 세그먼트의 예상 밖 오류 fallback — 렌더링 오류와
// throwOnError로 전파된 응답 계약 위반이 여기로 온다.
// (commerce) layout 안쪽 경계라 헤더는 생존한다.
export default function CommerceError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const queryClient = useQueryClient();

  // reset()만으로는 복구되지 않는다 — TanStack이 에러를 캐시에 들고 있어
  // 재마운트한 useQuery가 캐시된 에러를 throwOnError로 즉시 다시 던진다(재현으로 확인).
  // 에러 상태의 쿼리를 초기화한 뒤 세그먼트를 리셋해야 재조회가 일어난다.
  const retry = () => {
    void queryClient.resetQueries({
      predicate: (query) => query.state.status === 'error',
    });
    reset();
  };

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
