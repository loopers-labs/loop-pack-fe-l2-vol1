'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import React, { useState, useEffect } from 'react';
import { useCartStore } from '@/entities/cart/model/cartStore';
import { useWishlistStore } from '@/entities/wishlist/model/wishlistStore';

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

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
