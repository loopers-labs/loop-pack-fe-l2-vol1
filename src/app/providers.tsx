'use client';

import {
  environmentManager,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import type { ReactNode } from 'react';

function makeQueryClient() {
  return new QueryClient();
}

let browserQueryClient: QueryClient | undefined;

/**
 * 서버는 요청마다 새 client를 만들어 사용자 간 캐시가 섞이지 않게 한다.
 * 브라우저는 하나만 만들어 재사용한다. useState로 만들면 초기 렌더에서 아래 RSC가
 * suspend할 때 React가 client를 버려 캐시가 조용히 초기화된다.
 */
function getQueryClient() {
  if (environmentManager.isServer()) return makeQueryClient();

  if (!browserQueryClient) browserQueryClient = makeQueryClient();

  return browserQueryClient;
}

export default function Providers({ children }: { children: ReactNode }) {
  const queryClient = getQueryClient();

  return (
    <NuqsAdapter>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </NuqsAdapter>
  );
}
