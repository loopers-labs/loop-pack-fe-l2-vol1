"use client";

import { QueryClientProvider, QueryErrorResetBoundary } from "@tanstack/react-query";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import type { ReactNode } from "react";
import { AnalyticsInit } from "@/shared/analytics";
import { getQueryClient } from "@/shared/api/get-query-client";

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps): React.JSX.Element {
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <QueryErrorResetBoundary>
        <NuqsAdapter>
          <AnalyticsInit />
          {children}
        </NuqsAdapter>
      </QueryErrorResetBoundary>
    </QueryClientProvider>
  );
}
