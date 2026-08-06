'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { InvalidResponseError } from '@/shared/api/errors';

export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 20,
            // 계약 위반은 재시도해도 같으므로 0회, 그 외(HTTP·네트워크)는 1회만 —
            // 기본값(3회·지수 백오프)은 실패 인지까지 7초+ 걸렸다(RFC 0단계 실측).
            retry: (failureCount, error) =>
              !(error instanceof InvalidResponseError) && failureCount < 1,
            // 재시도가 의미 있는 오류(HTTP·네트워크)는 결과 영역 인라인에서 처리하고,
            // 계약 위반만 경계(error.tsx)로 던진다 — RFC 4단계 표와 일치해야 한다.
            throwOnError: (error) => error instanceof InvalidResponseError,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
