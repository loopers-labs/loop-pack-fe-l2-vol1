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
    <div className="rounded-gds-md bg-white py-20 text-center text-sm text-gds-gray-700 shadow-[inset_0_0_0_1px_var(--color-gds-gray-200)]">
      <p>{error instanceof Error ? error.message : "홈 데이터를 불러오지 못했습니다."}</p>
      <button
        className="mt-4 rounded-gds-sm border border-gds-cta bg-gds-cta px-4 py-2 text-sm font-semibold text-white hover:bg-gds-blue-500 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-gds-green-500"
        type="button"
        onClick={onRetry}
      >
        다시 시도
      </button>
    </div>
  );
}
