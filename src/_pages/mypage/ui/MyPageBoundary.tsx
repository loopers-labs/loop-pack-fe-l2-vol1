'use client';

import { Suspense } from 'react';

import { QueryErrorResetBoundary } from '@tanstack/react-query';
import { ErrorBoundary } from 'react-error-boundary';

import { MyPage } from './MyPage';

/**
 * 마이페이지 조회의 로딩, 에러 경계.
 * - 로딩: MyPage 의 useSuspenseQuery 가 suspend → Suspense fallback
 * - 에러: useSuspenseQuery 가 throw → ErrorBoundary fallback (reset 으로 재요청할 수 있게)
 *
 * 세션 만료(401)는 여기까지 오지 않는다. apiClient 의 인터셉터가 먼저 잡아
 * 로그인 화면으로 보내므로, 이 fallback 이 맡는 것은 서버 오류나 네트워크 실패다.
 */
export function MyPageBoundary() {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary
          onReset={reset}
          fallbackRender={({ resetErrorBoundary }) => (
            <div className="week05-section" role="alert">
              <p>프로필을 불러오지 못했습니다.</p>
              <button type="button" onClick={resetErrorBoundary}>
                다시 시도
              </button>
            </div>
          )}
        >
          <Suspense fallback={<p className="week05-section">프로필을 불러오는 중입니다…</p>}>
            <MyPage />
          </Suspense>
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
}
