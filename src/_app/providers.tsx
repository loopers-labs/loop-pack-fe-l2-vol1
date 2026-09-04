'use client';

import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import { useEffect, useState } from 'react';
import { SessionExpiredError } from '@/shared/api/SessionExpiredError';
// 5-c 결정: initAnalytics()는 여기서 부른다. 등록(registerProviders·setCommonProperties)은
// './setup' 모듈 로드 시점에 이미 끝나 있어(analytics/setup.ts), 여기서는 프로바이더
// 초기화와 큐 플러시만 하면 된다. 별도 컴포넌트를 두지 않는다 — 이미 있는 최상위 client
// 경계(Providers) 하나로 충분하다.
import { initAnalytics } from '@/analytics/logger';
import { redirectToLogin } from './redirectToLogin';

const handleSessionExpired = (error: unknown): void => {
  if (error instanceof SessionExpiredError) redirectToLogin();
};

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          // 세션 만료는 재시도해도 응답이 바뀌지 않는다 — 재시도 없이 바로 onError로 보낸다.
          queries: { staleTime: 20 * 1000, retry: (failureCount, error) => !(error instanceof SessionExpiredError) && failureCount < 3 }
        },
        queryCache: new QueryCache({ onError: handleSessionExpired }),
        mutationCache: new MutationCache({ onError: handleSessionExpired })
      })
  );

  useEffect(() => {
    void initAnalytics();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <NuqsAdapter>{children}</NuqsAdapter>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
