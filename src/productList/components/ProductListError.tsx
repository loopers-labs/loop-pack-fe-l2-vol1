/** 상품 목록 조회 실패 시 에러 메시지와 다시 시도 버튼을 보여준다. */
export default function ProductListError({
  error,
  onRetry,
}: {
  error: Error;
  onRetry: () => void;
}) {
  return (
    <div className="error">
      <p>오류가 발생했습니다: {error.message}</p>
      <button onClick={onRetry}>다시 시도</button>
    </div>
  );
}
