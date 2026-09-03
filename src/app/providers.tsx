'use client';

// 부수효과 import — 모듈이 로드되는 시점에 프로바이더 등록·공통 프로퍼티
// 설정·초기화를 실행한다. 가장 먼저 로드되는 이 파일에서 불러야 초기화가
// 늦어져 이벤트가 큐에 쌓이는 시간이 최소화된다.
import '@/shared/analytics/init-analytics';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import React, { useState, useEffect } from 'react';
import { useCartStore } from '@/entities/cart/model/cartStore';
import { useWishlistStore } from '@/entities/wishlist/model/wishlistStore';
import { createSessionAwareQueryClient } from '@/entities/session/model/createSessionAwareQueryClient';

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => createSessionAwareQueryClient());

  useEffect(() => {
    void useCartStore.persist.rehydrate();
    void useWishlistStore.persist.rehydrate();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <NuqsAdapter>{children}</NuqsAdapter>
      <ReactQueryDevtools />
    </QueryClientProvider>
  );
}
