'use client';

import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useWishlistStore } from '@/entities/wishlist/model/useWishlistStore';
import { useCartStore } from '@/entities/cart/model/useCartStore';
import { DEFAULT_PRODUCT_LIST_QUERY } from '@/entities/product/model/product';
import { productsQueryOptions } from '@/entities/product/api/productsQueryOptions';
import { sessionQueryOptions } from '@/entities/session/api/sessionQueryOptions';
import { LogoutButton } from '@/features/auth-logout/ui/LogoutButton';
import { LOGIN_PATH } from '@/shared/lib/safeRedirectPath';

/**
 * 로그인 상태를 세션 쿼리에서 읽는다. 값은 세 가지다.
 *
 * - `undefined` — 아직 모른다. 서버가 세션을 심어주지 않은 자리(예: 라우트 fallback)에서 나온다
 * - `null` — 로그인하지 않았다
 * - `AuthUser` — 로그인했다
 *
 * 모를 때 로그인 링크를 그리면 로그인한 사용자에게 "로그인" 상태를 잠깐 보여주게 된다.
 * 초기 HTML만 읽는 사람에게는 그게 사실과 다른 화면이므로, 모를 때는 어느 쪽도 단정하지 않는다.
 */
export function Header() {
  const wishlistCount = useWishlistStore((state) => state.productIds.size);
  const cartCount = useCartStore((state) => state.productIds.size);
  const queryClient = useQueryClient();
  const { data: user } = useQuery(sessionQueryOptions());
  const isSessionKnown = user !== undefined;

  return (
    <header className="week05-header">
      <Link href="/">Commerce</Link>
      <nav aria-label="주요 메뉴">
        <Link
          href="/products"
          onMouseEnter={() =>
            queryClient.prefetchQuery(productsQueryOptions(DEFAULT_PRODUCT_LIST_QUERY))
          }
        >
          상품
        </Link>
        <span>위시리스트 {wishlistCount}</span>
        {/* 보호 경로는 프리페치하지 않는다. 미로그인 상태에서 이 링크는 항상 보이는데,
            프리페치해도 proxy가 307로 로그인 경로를 돌려줄 뿐이라 화면에 쓰이지 않는다.
            클릭한 뒤에 로그인 화면으로 보내는 것으로 충분하다 */}
        <Link href="/orders/new" prefetch={false}>
          장바구니 {cartCount}
        </Link>
        {(() => {
          if (!isSessionKnown) return null;
          if (user === null) return <Link href={LOGIN_PATH}>로그인</Link>;

          return (
            <>
              <Link href="/orders" prefetch={false}>
                주문 내역
              </Link>
              <span>{user.name}님</span>
              <LogoutButton />
            </>
          );
        })()}
      </nav>
    </header>
  );
}
