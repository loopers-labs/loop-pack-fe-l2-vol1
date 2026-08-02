'use client';

import { Suspense, useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import { useWishlistStore } from '@/entities/wishlist/model/useWishlistStore';
import { useCartStore } from '@/entities/cart/model/useCartStore';

export function MainProvider({
  children,
}: {
  /** QueryClient·URL 상태 어댑터가 적용될 하위 트리 */
  children: React.ReactNode;
}) {
  const [queryClient] = useState(() => new QueryClient());

  useEffect(() => {
    useWishlistStore.persist.rehydrate();
    useCartStore.persist.rehydrate();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {/* NuqsAdapter가 내부적으로 useSearchParams()를 호출해 정적 프리렌더 시 Suspense 경계가 필요하다 */}
      <Suspense fallback={<div>불러오는 중입니다…</div>}>
        <NuqsAdapter>{children}</NuqsAdapter>
      </Suspense>
    </QueryClientProvider>
  );
}
