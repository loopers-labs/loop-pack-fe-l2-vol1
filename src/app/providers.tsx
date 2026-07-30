'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import type { ReactNode } from 'react';

import { useRestoreSavedStore } from '@/entities/client-state';
import { getQueryClient } from '@/shared/get-query-client';

export default function Providers({ children }: { children: ReactNode }) {
  const queryClient = getQueryClient();

  useRestoreSavedStore();

  return (
    <NuqsAdapter>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </NuqsAdapter>
  );
}
