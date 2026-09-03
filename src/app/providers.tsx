'use client';

import { type ReactNode, useEffect } from 'react';

import { consoleProvider } from '@/analytics/consoleProvider';
import { initAnalytics, registerProviders, setCommonProperties } from '@/analytics/logger';
import { getQueryClient } from '@/shared/api/queryClient';
import { getCommonProperties } from '@/shared/lib/analytics/commonProperties';
import { QueryClientProvider } from '@tanstack/react-query';
import { NuqsAdapter } from 'nuqs/adapters/next/app';

let analyticsWired = false;

/**
 * 프로바이더 등록과 공통 프로퍼티 연결.
 *
 * **effect 가 아니라 렌더 단계에서 한다.** React 는 자식 effect 를 부모보다 먼저 돌리므로,
 * 이 배선을 Providers 의 useEffect 에 두면 첫 화면의 진입 이벤트(product_list_view 등)가
 * 먼저 발화한다. track() 은 호출 시점에 공통 프로퍼티를 스냅샷하므로, 그 이벤트들은
 * 나중에 큐가 비워질 때도 sessionId·device·ts 가 없는 채로 나간다.
 *
 * 등록 자체는 값을 담아두기만 하고 브라우저 API 를 건드리지 않아 SSR 에서도 안전하다.
 * getCommonProperties 는 함수로 넘어가 이벤트 발생 시점에만 평가된다.
 */
function wireAnalytics(): void {
  if (analyticsWired) {
    return;
  }

  analyticsWired = true;
  registerProviders([consoleProvider]);
  setCommonProperties(getCommonProperties);
}

/**
 * 클라이언트 전역 Provider.
 */
export function Providers({ children }: { children: ReactNode }) {
  const queryClient = getQueryClient();

  wireAnalytics();

  // 초기화만 effect 에 둔다. 프로바이더의 SDK 로드가 비동기고 브라우저에서만 의미가 있다.
  // 그 전에 쌓인 이벤트는 logger 의 큐에 있다가 순서대로 나간다.
  useEffect(() => {
    void initAnalytics();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <NuqsAdapter>{children}</NuqsAdapter>
    </QueryClientProvider>
  );
}
