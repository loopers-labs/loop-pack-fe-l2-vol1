"use client";

import { QueryErrorResetBoundary } from "@tanstack/react-query";
import { ErrorBoundary } from "react-error-boundary";
import type { ReactNode } from "react";

type HomeErrorBoundaryProps = {
  children: ReactNode;
};

export function HomeErrorBoundary({ children }: HomeErrorBoundaryProps) {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary
          onReset={reset}
          fallbackRender={({ error, resetErrorBoundary }) => (
            <HomeErrorFallback error={error} onRetry={resetErrorBoundary} />
          )}
        >
          {children}
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
}

function HomeErrorFallback({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  return (
    <div className="py-20 text-center">
      <p>{error instanceof Error ? error.message : "홈 데이터를 불러오지 못했습니다."}</p>
      <button
        className="mt-4 border border-[#c8c8c8] bg-transparent px-3 py-2 focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#2557a7]"
        type="button"
        onClick={onRetry}
      >
        다시 시도
      </button>
    </div>
  );
}
