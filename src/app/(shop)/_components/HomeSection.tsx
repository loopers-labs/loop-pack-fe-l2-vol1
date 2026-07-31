'use client';

import { Suspense } from 'react';

import { QueryErrorResetBoundary } from '@tanstack/react-query';
import { ErrorBoundary } from 'react-error-boundary';

import { HomeView } from './HomeView';

/**
 * 홈 데이터 조회의 로딩, 에러 경계.
 * - 로딩: HomeView 의 useSuspenseQuery 가 suspend → Suspense fallback
 * - 에러: useSuspenseQuery 가 throw → ErrorBoundary fallback (reset 으로 리스트를 재요청할 수 있게)
 */
export function HomeSection() {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary
          onReset={reset}
          fallbackRender={({ resetErrorBoundary }) => (
            <div className="week05-section" role="alert">
              <p>홈 데이터를 불러오지 못했습니다.</p>
              <button type="button" onClick={resetErrorBoundary}>
                다시 시도
              </button>
            </div>
          )}
        >
          <Suspense fallback={<p className="week05-section">홈 데이터를 불러오는 중입니다…</p>}>
            <HomeView />
          </Suspense>
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
}
