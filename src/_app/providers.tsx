"use client";

import { useEffect, type ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { getQueryClient } from "@/shared/api";
import { SessionExpiryListener } from "@/entities/session";
import { AnalyticsBootstrap } from "./AnalyticsBootstrap";
import { AnalyticsIdentity } from "./AnalyticsIdentity";
import { useCartStore } from "@/entities/cart";
import { useWishlistStore } from "@/entities/wishlist";

export function Providers({ children }: { children: ReactNode }) {
  const queryClient = getQueryClient();

  // cart·wishlist store 는 persist(skipHydration) 라 자동 복원을 하지 않는다.
  // 서버·클라 첫 렌더를 빈 상태로 일치시킨 뒤, 마운트 후 여기서 복원을 트리거한다(hydration mismatch 회피).
  useEffect(() => {
    useCartStore.persist.rehydrate();
    useWishlistStore.persist.rehydrate();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <SessionExpiryListener />
      <AnalyticsBootstrap />
      <AnalyticsIdentity />
      <NuqsAdapter>{children}</NuqsAdapter>
    </QueryClientProvider>
  );
}
