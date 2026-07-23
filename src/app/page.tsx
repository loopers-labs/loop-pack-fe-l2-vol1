import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import Link from 'next/link';
import { connection } from 'next/server';
import { Suspense } from 'react';

import { CartCount } from '@/features/products/CartCount';
import { HomeContent } from '@/features/products/HomeContent';
import { WishlistCount } from '@/features/products/WishlistCount';
import { productQueries } from '@/features/products/queries';
import { getQueryClient } from '@/shared/get-query-client';

export default function HomePage() {
  return (
    <main className="week05-page">
      <header className="week05-header">
        <Link href="/">Commerce</Link>
        <div className="week05-header-actions">
          <nav aria-label="주요 메뉴">
            <Link href="/products">상품</Link>
          </nav>
          <WishlistCount />
          <CartCount />
        </div>
      </header>

      <Suspense
        fallback={
          <p className="week05-status" role="status">
            홈을 불러오는 중입니다…
          </p>
        }
      >
        <HomePageInner />
      </Suspense>
    </main>
  );
}

async function HomePageInner() {
  // 빌드 중이 아니라 실제 요청이 들어온 뒤에 내부 API를 부르게 한다.
  await connection();

  const queryClient = getQueryClient();

  await queryClient.prefetchQuery(productQueries.home());

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <HomeContent />
    </HydrationBoundary>
  );
}
