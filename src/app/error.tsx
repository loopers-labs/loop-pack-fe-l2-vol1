// [AI] 전역 에러 경계(app/error.tsx). 5xx에러인 경우 이 fallback이 보여진다.
'use client';

import { useEffect } from 'react';

type ErrorBoundaryProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

const GlobalError = ({ error, reset }: ErrorBoundaryProps) => {
  useEffect(() => {
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
