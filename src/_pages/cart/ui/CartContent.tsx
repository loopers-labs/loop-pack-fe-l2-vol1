'use client';

import { useCartStore } from '@/entities/cart/model/cartStore';
import { CartEmptyState } from './CartEmptyState';
import { CartFilledState } from './CartFilledState';
import { CartProductFeed } from './CartProductFeed';

export function CartContent() {
  const cartItems = useCartStore((state) => state.items);
  const isHydrated = useCartStore((state) => state.isHydrated);

  if (!isHydrated) {
    return (
      <main
        aria-label="장바구니를 불러오는 중"
        className="mx-auto min-h-[70vh] w-full px-4 py-12 sm:px-6 sm:py-16 lg:px-8"
      >
        <div className="mx-auto h-72 max-w-3xl animate-pulse rounded-2xl bg-border/50" />
      </main>
    );
  }

  const items = Array.from(cartItems.values());

  if (items.length > 0) {
    return <CartFilledState items={items} />;
  }

  return (
    <main className="min-h-screen">
      <CartEmptyState />
      <div className="mx-auto w-full px-4 pb-12 sm:px-6 sm:pb-16 lg:px-8">
        <CartProductFeed />
      </div>
    </main>
  );
}
