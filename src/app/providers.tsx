'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import { CartStoreProvider } from '@/entities/cart/model/CartStoreProvider';
import { CartDialog } from '@/features/cart/ui/CartDialog';
import { PersistedStoreHydrator } from './_components/PersistedStoreHydrator';
import { getQueryClient } from './getQueryClient';
import type { CartOwnerKey } from '@/entities/cart/model/cartOwner';

interface ProvidersProps {
  cartOwnerKey: CartOwnerKey;
  children: React.ReactNode;
}

export function Providers({ cartOwnerKey, children }: ProvidersProps) {
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <NuqsAdapter>
        <CartStoreProvider ownerKey={cartOwnerKey}>
          <PersistedStoreHydrator />
          {children}
          <CartDialog />
        </CartStoreProvider>
      </NuqsAdapter>
    </QueryClientProvider>
  );
}
