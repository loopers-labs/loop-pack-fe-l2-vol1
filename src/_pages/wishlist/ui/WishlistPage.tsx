'use client';

import Link from 'next/link';
import { useWishlistStore } from '@/entities/wishlist';
import { SavedProductGrid } from '@/widgets/product-card';

export default function WishlistPage() {
  const wishlistIds = useWishlistStore((state) => state.ids);

  if (wishlistIds.size === 0) {
    return (
      <main className="page-container">
        <h1>위시리스트</h1>
        <div className="empty-state">
          <p>찜한 상품이 없습니다.</p>
          <Link className="empty-state-action" href="/products">
            상품 보러 가기
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="page-container">
      <h1>위시리스트</h1>
      {/* 카드의 '찜' 버튼이 이미 토글이라 여기서 그대로 빼는 수단이 된다 */}
      <SavedProductGrid productIds={wishlistIds} />
    </main>
  );
}
