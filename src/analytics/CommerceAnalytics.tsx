'use client';

import { useEffect, useLayoutEffect, type ReactNode } from 'react';

import { identify, startAnalytics } from './events';

/**
 * 커머스 콘텐츠를 감싸 분석 부트스트랩과 최초 신원 설정을 담당한다.
 * identify는 layout effect라 같은 커밋의 페이지뷰(useEffect)보다 먼저,
 * 나중 커밋에 마운트되는 페이지보다는 시간상 먼저 실행된다.
 */
export function CommerceAnalytics({
  initialUserId,
  children,
}: {
  initialUserId: string | null;
  children: ReactNode;
}) {
  useLayoutEffect(() => {
    if (initialUserId) identify(initialUserId);
  }, [initialUserId]);

  useEffect(() => {
    void startAnalytics();
  }, []);

  return <>{children}</>;
}
