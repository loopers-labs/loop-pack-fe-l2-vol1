'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { logout } from '@/entities/auth/api/authService';
import type { AuthUser } from '@/entities/auth/model/types';
import { productListInfiniteQueryOptions } from '@/entities/product/api/productQueries';
import { useCartStore } from '@/entities/cart/model/cartStore';
import { useWishlistStore } from '@/entities/wishlist/model/wishlistStore';

interface HeaderNavProps {
  user: AuthUser | null;
}

export function HeaderNav({ user }: HeaderNavProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);
  const cartCount = useCartStore((s) => s.items.size);
  const isCartHydrated = useCartStore((s) => s.isHydrated);
  const wishlistCount = useWishlistStore((s) => s.ids.size);
  const isWishlistHydrated = useWishlistStore((s) => s.isHydrated);

  const prefetchProducts = useCallback(() => {
    void queryClient.prefetchInfiniteQuery(
      productListInfiniteQueryOptions({ category: 'all', sort: 'latest' }),
    );
  }, [queryClient]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    setLogoutError(null);

    try {
      await logout();
      router.replace('/');
      router.refresh();
    } catch {
      setLogoutError('로그아웃에 실패했습니다.');
      setIsLoggingOut(false);
    }
  };

  return (
    <nav className="flex items-center gap-3 text-[13px] font-semibold text-text-secondary sm:gap-7 sm:text-[14px]">
      <Link
        href="/products"
        className="flex min-h-11 items-center rounded-sm transition-colors hover:text-text focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-text"
        onMouseEnter={prefetchProducts}
      >
        상품
      </Link>
      <span className="hidden text-text-caption md:inline" aria-live="polite">
        위시리스트 {isWishlistHydrated ? wishlistCount : '…'}
      </span>
      <Link
        href="/cart"
        className="flex min-h-11 items-center rounded-sm transition-colors hover:text-text focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-text"
      >
        장바구니 {isCartHydrated ? cartCount : '…'}
      </Link>
      {user ? (
        <>
          <Link
            href="/orders"
            className="hidden min-h-11 items-center rounded-sm transition-colors hover:text-text focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-text sm:flex"
          >
            주문 내역
          </Link>
          <span className="sr-only">{user.name} 로그인 중</span>
          <button
            type="button"
            onClick={() => void handleLogout()}
            disabled={isLoggingOut}
            className="flex min-h-11 items-center rounded-sm transition-colors hover:text-text focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-text disabled:cursor-wait disabled:opacity-50"
          >
            {isLoggingOut ? '로그아웃 중' : '로그아웃'}
          </button>
        </>
      ) : (
        <Link
          href="/login"
          className="flex min-h-11 items-center rounded-sm transition-colors hover:text-text focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-text"
        >
          로그인
        </Link>
      )}
      {logoutError && (
        <span role="alert" className="sr-only">
          {logoutError}
        </span>
      )}
    </nav>
  );
}
