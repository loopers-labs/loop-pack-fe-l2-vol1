'use client';

import Link from 'next/link';
import { useWishlistStore } from '@/entities/wishlist/model/wishlistStore';
import { useCartStore } from '@/entities/cart/model/useCartStore';
import { formatWon, calcDiscount } from '@/shared/lib/format';
import type { Product } from '@/entities/product/model/types';

interface ProductCardProps {
  product: Product;
}

function HeartIcon({ isFilled }: { isFilled: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={`size-7 translate-y-1 drop-shadow-[0_1px_2px_rgb(0_0_0/0.65)] ${isFilled ? 'fill-current' : 'fill-none'}`}
    >
      <path
        d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CartIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="size-7 -translate-x-0.5 -translate-y-1 fill-none drop-shadow-[0_1px_2px_rgb(0_0_0/0.65)]"
    >
      <path
        d="M3 4h2l2.4 10.7a2 2 0 0 0 2 1.6h8.8a2 2 0 0 0 2-1.6L22 8H6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="9" cy="20" r="1" fill="currentColor" />
      <circle cx="19" cy="20" r="1" fill="currentColor" />
    </svg>
  );
}

export function ProductCard({ product }: ProductCardProps) {
  const isWished = useWishlistStore((state) => state.ids.has(product.id));
  const toggle = useWishlistStore((state) => state.toggle);
  const addItem = useCartStore((state) => state.addItem);

  return (
    <article className="group flex min-w-0 flex-col">
      <div className="relative">
        <Link
          href={`/products/${product.id}`}
          aria-label={`${product.name} 상세 보기`}
          className="block rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-neutral-950"
        >
          <div className="aspect-square overflow-hidden rounded-lg bg-neutral-100">
            <img
              src={product.image}
              alt={product.name}
              loading="lazy"
              className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
            />
          </div>
        </Link>

        <div className="absolute bottom-1 right-1 z-10 flex w-10 flex-col items-center">
          <button
            type="button"
            onClick={() => toggle(product.id)}
            aria-label={`${product.name} ${isWished ? '찜 해제' : '찜하기'}`}
            aria-pressed={isWished}
            className={`flex size-10 items-center justify-center transition-opacity hover:opacity-70 focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-white ${
              isWished ? 'text-red-500' : 'text-white'
            }`}
          >
            <HeartIcon isFilled={isWished} />
          </button>
          <button
            type="button"
            onClick={() => addItem(product.id)}
            aria-label={`${product.name} 장바구니에 담기`}
            className="flex size-10 items-center justify-center text-white transition-opacity hover:opacity-70 focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-white"
          >
            <CartIcon />
          </button>
        </div>
      </div>

      <Link
        href={`/products/${product.id}`}
        className="rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-neutral-950"
      >
        <div className="pt-3">
          <p className="truncate text-xs font-medium text-neutral-500">
            {product.brand}
          </p>
          <h3 className="mt-1 line-clamp-2 min-h-10 text-sm leading-5 text-neutral-800 transition-colors group-hover:text-neutral-500 sm:text-[15px]">
            {product.name}
          </h3>
          <div className="mt-2 flex flex-wrap items-baseline gap-x-1.5">
            {product.originalPrice && (
              <span className="text-base font-bold text-neutral-500">
                {calcDiscount(product.originalPrice, product.price)}%
              </span>
            )}
            <span className="text-base font-bold tracking-[-0.02em] text-neutral-950">
              {formatWon(product.price)}
            </span>
          </div>
          <p className="mt-1 text-xs font-semibold text-neutral-500">
            평점 {product.rating.toFixed(1)} · 리뷰{' '}
            {product.reviewCount.toLocaleString('ko-KR')}
          </p>
          {product.freeShipping && (
            <span className="mt-2 inline-flex border border-neutral-300 px-1.5 py-0.5 text-[11px] font-semibold text-neutral-600">
              무료배송
            </span>
          )}
        </div>
      </Link>
    </article>
  );
}
