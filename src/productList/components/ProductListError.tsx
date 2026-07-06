type ProductListErrorProps = {
  message: string;
  onRetry: () => void;
};

export function ProductListError({ message, onRetry }: ProductListErrorProps) {
  return (
    <div className="error">
      <p>오류가 발생했습니다: {message}</p>
      <button onClick={onRetry}>다시 시도</button>
    </div>
  );
}
