'use client';

import type { ReactNode } from 'react';
import { ErrorBoundary } from '@/shared/ui/error-boundary/ErrorBoundary';

interface ProductListErrorBoundaryProps {
  children: ReactNode;
}

export function ProductListErrorBoundary({
  children,
}: ProductListErrorBoundaryProps) {
  return (
    <ErrorBoundary
      fallback={(error, reset) => (
        <div className="flex min-h-[50vh] items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <p className="text-sm text-text-secondary">
              {error.message || '오류가 발생했습니다.'}
            </p>
            <button
              type="button"
              onClick={reset}
              className="text-[13px] font-medium text-brand transition-colors hover:text-brand/80"
            >
              다시 시도
            </button>
          </div>
        </div>
      )}
    >
      {children}
    </ErrorBoundary>
  );
}
