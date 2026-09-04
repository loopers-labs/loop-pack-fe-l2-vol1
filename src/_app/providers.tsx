"use client";
import { QueryClientProvider } from "@tanstack/react-query";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { useState } from "react";
import { createBrowserQueryClient } from "./createQueryClient";

export function Providers({ children }: { children: React.ReactNode }) {
  // 클라이언트 마운트당 한 번만 생성 — 렌더마다 새 client를 만들면 캐시가 날아간다.
  const [queryClient] = useState(createBrowserQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      <NuqsAdapter>{children}</NuqsAdapter>
    </QueryClientProvider>
  );
}
