'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { makeQueryClient } from '@/lib/queryClient';

// useState 초기화 함수로 전달해 클라이언트에서 QueryClient를 한 번만 생성한다. (AI 활용)
// React Strict Mode에서도 인스턴스가 중복 생성되지 않는다.
export const QueryProvider = ({ children }: { children: React.ReactNode }) => {
  const [queryClient] = useState(makeQueryClient);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};
