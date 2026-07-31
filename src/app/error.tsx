// [AI] 전역 에러 경계(app/error.tsx). 예상 밖 렌더링 오류의 마지막 보루 fallback.
// (현재 throwOnError 미적용 상태 — 쿼리 5xx는 widget에서 인라인 처리되므로
//  여기는 주로 렌더 크래시를 잡는다. throwOnError 도입은 RFC O 섹션 기준으로 별도 적용 예정.)
'use client';

import { useEffect } from 'react';

type ErrorBoundaryProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

const GlobalError = ({ error, reset }: ErrorBoundaryProps) => {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error(error);
  }, [error]);

  return (
    <main className="page">
      <section className="section" role="alert">
        <h2>문제가 발생했습니다.</h2>
        <p>잠시 후 다시 시도해 주세요.</p>
        <button type="button" onClick={() => reset()}>
          다시 시도
        </button>
      </section>
    </main>
  );
};

export default GlobalError;
