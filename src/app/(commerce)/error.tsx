'use client';

/**
 * 조회 실패는 각 화면이 인라인으로 처리하므로 여기는 예상 밖 렌더링 오류 전담이다.
 * reset만으로는 서버 컴포넌트를 다시 렌더하지 않아 unstable_retry(reset + refresh)를 쓴다.
 */
export default function CommerceError({
  unstable_retry: retry,
}: {
  unstable_retry: () => void;
}) {
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
