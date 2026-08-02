'use client';

type HomeErrorProps = {
  /** 렌더링 중 발생한 예상 못한 오류 */
  error: Error;
  /** 이 세그먼트를 다시 렌더링 시도 */
  reset: () => void;
};

/* AI-generated : week06-fsd.md 9단계 기준 — Next.js가 이 파일을 fallback으로 라우트 세그먼트를 자동으로 Error Boundary로 감싼다.
   API 실패(QueryState/ErrorRetry가 인라인 처리)가 아니라 순수 렌더링 버그만을 위한 최후 방어선 */
export default function HomeError({ reset }: HomeErrorProps) {
  return (
    <main className="week05-page">
      <p role="alert">문제가 발생했습니다.</p>
      <button type="button" onClick={reset}>
        다시 시도
      </button>
    </main>
  );
}
