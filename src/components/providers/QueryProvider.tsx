'use client';

import { environmentManager, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { makeQueryClient } from '@/lib/queryClient';

// [AI] 브라우저에서는 모듈 스코프 싱글턴을 재사용하고, 서버에서는 매번 새 인스턴스를 만든다.
// useState로 관리하면 서스펜션 시 React가 인스턴스를 버리면서 하이드레이션된 캐시가 날아갈 수 있다.
// 공식 문서 권장 패턴.
let browserQueryClient: QueryClient | undefined;

const getQueryClient = (): QueryClient => {
  if (environmentManager.isServer()) {
    return makeQueryClient();
  }
  if (!browserQueryClient) {
    browserQueryClient = makeQueryClient();
  }
  return browserQueryClient;
};

export const QueryProvider = ({ children }: { children: React.ReactNode }) => {
  const queryClient = getQueryClient();

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};
