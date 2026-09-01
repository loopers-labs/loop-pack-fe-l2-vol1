import { cookies } from 'next/headers';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { CommerceAnalytics } from '@/analytics/CommerceAnalytics';
import { readSessionToken } from '@/app/api/_data/auth';
import { SESSION_COOKIE } from '@/app/api/_data/auth-cookies';
import { CartCount } from '@/entities/cart';
import { SessionProvider } from '@/entities/session';
import { WishlistCount } from '@/entities/wishlist';
import { SessionMenu } from '@/features/auth';

/**
 * /api/auth/me 대신 쿠키를 직접 검증해 500ms mock 지연 없이 첫 HTML부터 로그인 상태를 그린다.
 * cookies()를 읽으므로 커머스 화면은 모두 동적 렌더링이 된다.
 */
export default async function CommerceLayout({
  children,
}: {
  children: ReactNode;
}) {
  const cookieStore = await cookies();
  const initialUser = readSessionToken(cookieStore.get(SESSION_COOKIE)?.value);

  return (
    <SessionProvider initialUser={initialUser}>
      <CommerceAnalytics initialUserId={initialUser?.id ?? null}>
        <main className="week05-page">
          <header className="week05-header">
            <Link href="/">Commerce</Link>
            <div className="week05-header-actions">
              <nav aria-label="주요 메뉴">
                <Link href="/products">상품</Link>
              </nav>
              <WishlistCount />
              <Link href="/cart">
                <CartCount />
              </Link>
              <SessionMenu />
            </div>
          </header>
          {children}
        </main>
      </CommerceAnalytics>
    </SessionProvider>
  );
}
