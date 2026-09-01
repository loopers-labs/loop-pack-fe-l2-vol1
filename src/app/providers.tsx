'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import React, { useState, useEffect } from 'react';
import { useCartStore } from '@/entities/cart/model/cartStore';
import { useWishlistStore } from '@/entities/wishlist/model/wishlistStore';
import { createSessionAwareQueryClient } from '@/entities/session/model/createSessionAwareQueryClient';

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => createSessionAwareQueryClient());

  useEffect(() => {
    void useCartStore.persist.rehydrate();
    void useWishlistStore.persist.rehydrate();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <NuqsAdapter>{children}</NuqsAdapter>
      <ReactQueryDevtools />
    </QueryClientProvider>
  );
}
