"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { selectCartCount, selectCartHasHydrated, useCartStore } from "@/entities/cart";
import { logout, sessionQueries } from "@/entities/session";
import {
  selectWishlistCount,
  selectWishlistHasHydrated,
  useWishlistStore,
} from "@/entities/wishlist";

export function CommerceHeader() {
  const queryClient = useQueryClient();
  const sessionQuery = useQuery(sessionQueries.me());
  const cartHasHydrated = useCartStore(selectCartHasHydrated);
  const wishlistHasHydrated = useWishlistStore(selectWishlistHasHydrated);
  const wishlistCount = useWishlistStore(selectWishlistCount);
  const cartCount = useCartStore(selectCartCount);
  const visibleWishlistCount = wishlistHasHydrated ? String(wishlistCount) : "-";
  const visibleCartCount = cartHasHydrated ? String(cartCount) : "-";
  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.setQueryData(sessionQueries.me().queryKey, { user: null });
    },
  });
  const user = sessionQuery.data?.user ?? null;

  return (
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-gds-gray-200 bg-gds-gray-100/95 pb-5 max-[480px]:items-start">
      <Link className="text-xl font-bold tracking-tight text-gds-gray-900" href="/">
        Commerce
      </Link>
      <nav
        className="flex flex-wrap items-center gap-2 text-sm text-gds-gray-700 max-[480px]:w-full"
        aria-label="주요 메뉴"
      >
        <Link
          className="rounded-gds-sm px-2.5 py-1.5 font-semibold text-gds-gray-900 hover:bg-gds-green-50 hover:text-gds-green-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gds-green-500"
          href="/products"
        >
          상품
        </Link>
        <span
          className="inline-flex min-w-[7.5rem] items-center justify-center gap-1 rounded-full bg-white px-3 py-1.5 font-semibold text-gds-green-700 shadow-[inset_0_0_0_1px_var(--color-gds-gray-200)]"
          aria-label={`위시리스트 ${visibleWishlistCount}`}
        >
          <span>위시리스트</span>
          <span className="inline-block min-w-[2ch] text-center">{visibleWishlistCount}</span>
        </span>
        <Link
          className="inline-flex min-w-[7rem] items-center justify-center gap-1 rounded-full bg-white px-3 py-1.5 font-semibold text-gds-green-700 shadow-[inset_0_0_0_1px_var(--color-gds-gray-200)]"
          aria-label={`장바구니 ${visibleCartCount}`}
          href="/cart"
        >
          <span>장바구니</span>
          <span className="inline-block min-w-[2ch] text-center">{visibleCartCount}</span>
        </Link>
        {user === null ? (
          <Link
            className="rounded-gds-sm px-2.5 py-1.5 font-semibold text-gds-gray-900 hover:bg-gds-green-50 hover:text-gds-green-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gds-green-500"
            href="/login"
          >
            로그인
          </Link>
        ) : (
          <span className="inline-flex items-center gap-2">
            <span className="font-semibold text-gds-gray-900">{user.name}님</span>
            <button
              className="cursor-pointer rounded-gds-sm border border-gds-gray-300 bg-white px-2.5 py-1.5 font-semibold text-gds-gray-900 hover:border-gds-green-500 hover:bg-gds-green-50 hover:text-gds-green-700 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gds-green-500"
              type="button"
              disabled={logoutMutation.isPending}
              onClick={() => logoutMutation.mutate()}
            >
              로그아웃
            </button>
          </span>
        )}
      </nav>
    </header>
  );
}
