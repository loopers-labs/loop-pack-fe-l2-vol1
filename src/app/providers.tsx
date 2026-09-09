'use client';

import { Suspense, useEffect, useState } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import { useRouter } from 'next/navigation';
import { useWishlistStore } from '@/entities/wishlist/model/useWishlistStore';
import { useCartStore } from '@/entities/cart/model/useCartStore';
import { getBrowserQueryClient, setLoginRedirect } from './queryClient';
import './analyticsBootstrap';

/**
 * 앱 전체가 함께 쓰는 것들을 붙인다 — QueryClient, URL 상태 어댑터, 저장된 클라이언트 상태.
 *
 * 계측 준비는 여기서 하지 않는다. `analyticsBootstrap`이 모듈이 로드될 때 끝내므로 어떤 화면의
 * effect보다도 앞선다. 렌더 중에 하면 버려지는 렌더에서도 모듈 상태가 바뀌어 되돌릴 수 없다.
 */
export function MainProvider({
  children,
}: {
  /** QueryClient·URL 상태 어댑터가 적용될 하위 트리 */
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [queryClient] = useState(getBrowserQueryClient);

  // 401 처리기가 쓸 이동 방법을 넘긴다. 401은 사용자 조작 뒤에만 오므로 이 시점이면 늦지 않다
  useEffect(() => {
    setLoginRedirect((path) => router.replace(path));
  }, [router]);

  // 저장된 장바구니·찜을 되살린다. hydration이 끝난 뒤여야 서버 HTML과 첫 렌더가 어긋나지 않는다.
  // 복원을 기다려야 하는 화면은 스토어의 완료 신호를 직접 구독한다 (useCartHydrated)
  useEffect(() => {
    void useWishlistStore.persist.rehydrate();
    void useCartStore.persist.rehydrate();
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
