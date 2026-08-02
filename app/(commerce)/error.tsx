"use client";

import { useQueryErrorResetBoundary } from "@tanstack/react-query";

interface CommerceErrorProps {
  error: Error;
  reset: () => void;
}

export default function CommerceError({ error, reset }: CommerceErrorProps) {
  const { reset: resetQueryError } = useQueryErrorResetBoundary();

  const handleRetry = () => {
    resetQueryError();
    reset();
  };

  return (
    <main>
      <h2>페이지를 불러오는데 실패했습니다</h2>
      <p>{error.message}</p>
      <button type="button" onClick={handleRetry}>
        다시 시도
      </button>
    </main>
  );
}
