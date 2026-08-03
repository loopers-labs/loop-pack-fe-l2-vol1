'use client';

export default function CommerceError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="week05-error">
      <p>예상하지 못한 오류가 발생했습니다.</p>
      <p>{error.message}</p>
      <button type="button" onClick={reset}>
        다시 시도
      </button>
    </div>
  );
}
