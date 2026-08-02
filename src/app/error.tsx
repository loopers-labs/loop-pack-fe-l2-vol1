'use client';

type RootErrorProps = {
  /** 렌더링 중 발생한 예상 못한 오류 */
  error: Error;
  /** 이 세그먼트를 다시 렌더링 시도 */
  reset: () => void;
};

/* AI-generated : week06-fsd.md 9단계 기준 — 자기 전용 error.tsx가 없는 라우트(/examples 등)를 위한 최상위 catch-all.
   (home)/products는 이미 자기 것이 있어 이걸 안 거친다. 같은 레벨의 layout.tsx 에러는 못 잡음(global-error.tsx 영역) */
export default function RootError({ reset }: RootErrorProps) {
  return (
    <main className="week05-page">
      <p role="alert">문제가 발생했습니다.</p>
      <button type="button" onClick={reset}>
        다시 시도
      </button>
    </main>
  );
}
