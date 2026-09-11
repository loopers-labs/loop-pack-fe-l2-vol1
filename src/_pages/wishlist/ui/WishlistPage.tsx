"use client";

import Link from "next/link";
import {
  selectWishlistCount,
  selectWishlistProductIdMap,
  useWishlistStore,
} from "@/entities/wishlist";

export function WishlistPage() {
  const wishlistProductIdMap = useWishlistStore(selectWishlistProductIdMap);
  const wishlistCount = useWishlistStore(selectWishlistCount);
  const wishlistProductIds = Object.keys(wishlistProductIdMap);

  return (
    <section className="mt-10 grid gap-6">
      <div className="grid gap-2">
        <p className="text-sm font-semibold text-gds-green-700">Wishlist</p>
        <h1 className="text-3xl font-bold tracking-tight text-gds-gray-900">위시리스트</h1>
        <p className="text-sm leading-6 text-gds-gray-700">찜한 상품을 확인합니다.</p>
      </div>

      <div className="rounded-gds-lg bg-white p-5 shadow-[inset_0_0_0_1px_var(--color-gds-gray-200)]">
        <p className="text-sm font-semibold text-gds-gray-900">총 {wishlistCount}개</p>

        {wishlistProductIds.length === 0 ? (
          <div className="mt-5 grid gap-4 border-t border-gds-gray-200 pt-5">
            <p className="text-sm text-gds-gray-700">찜한 상품이 없습니다.</p>
            <Link
              className="w-fit rounded-gds-sm border border-gds-green-500 bg-gds-green-500 px-4 py-2 text-sm font-semibold text-white hover:bg-gds-green-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gds-green-500"
              href="/products"
            >
              상품 둘러보기
            </Link>
          </div>
        ) : (
          <ul className="mt-5 grid gap-3 border-t border-gds-gray-200 pt-5">
            {wishlistProductIds.map((productId) => (
              <li
                key={productId}
                className="rounded-gds-sm bg-gds-gray-50 px-4 py-3 text-sm font-semibold text-gds-gray-900"
                aria-label={`${productId} 찜한 상품`}
              >
                {productId}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
