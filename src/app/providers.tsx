'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import { CartDialog } from '@/components/CartDialog';
import { getQueryClient } from './getQueryClient';

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <NuqsAdapter>
        {children}
        <CartDialog />
      </NuqsAdapter>
    </QueryClientProvider>
  );
}
