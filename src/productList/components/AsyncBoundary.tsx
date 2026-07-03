import type { ReactNode } from "react";

interface AsyncBoundaryProps {
  isLoading: boolean;
  error: Error | null;
  onRetry: () => void;
  children: ReactNode;
}

export function AsyncBoundary({
  isLoading,
  error,
  onRetry,
  children,
}: AsyncBoundaryProps) {
  if (isLoading) {
    return <div className="loading">로딩 중...</div>;
  }

  if (error) {
    return (
      <div className="error">
        <p>오류가 발생했습니다: {error.message}</p>
        <button onClick={onRetry}>다시 시도</button>
      </div>
    );
  }

  return <>{children}</>;
}
