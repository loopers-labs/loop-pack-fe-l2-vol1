'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { createAppQueryClient } from '@/shared/api/query-client';

export function QueryProvider({ children }: { children: ReactNode }) {
  // 정책은 shared/api/query-client가 소유한다 — 통합 테스트도 같은 팩토리를 쓴다.
  const [queryClient] = useState(createAppQueryClient);

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
