"use client";

import { useEffect, type ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { getQueryClient } from "@/lib/queryClient";
import { useCommerceStore } from "@/stores/commerceStore";

export function Providers({ children }: { children: ReactNode }) {
  const queryClient = getQueryClient();

  // commerceStore 는 persist(skipHydration) 라 자동 복원을 하지 않는다.
  // 서버·클라 첫 렌더를 빈 상태로 일치시킨 뒤, 마운트 후 여기서 복원을 트리거한다(hydration mismatch 회피).
  useEffect(() => {
    useCommerceStore.persist.rehydrate();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <NuqsAdapter>{children}</NuqsAdapter>
    </QueryClientProvider>
  );
}
