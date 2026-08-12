"use client";

import { QueryClientProvider, QueryErrorResetBoundary } from "@tanstack/react-query";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { useState, type ReactNode } from "react";
import { getQueryClient } from "@/shared/api/get-query-client";

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps): React.JSX.Element {
  const [queryClient] = useState(getQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      <QueryErrorResetBoundary>
        <NuqsAdapter>{children}</NuqsAdapter>
      </QueryErrorResetBoundary>
    </QueryClientProvider>
  );
}
