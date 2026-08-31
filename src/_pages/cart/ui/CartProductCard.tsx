'use client';

import Link from 'next/link';
import { useCartStore } from '@/entities/cart/model/cartStore';
import type { Product } from '@/entities/product/model/types';
import { useWishlistStore } from '@/entities/wishlist/model/wishlistStore';
import { formatWon } from '@/shared/lib/format';

interface CartProductCardProps {
  product: Product;
}

export function CartProductCard({ product }: CartProductCardProps) {
  const addItem = useCartStore((state) => state.addItem);
  const isWished = useWishlistStore((state) => state.ids.has(product.id));
  const toggleWishlist = useWishlistStore((state) => state.toggle);

  return (
    <article className="group min-w-0">
      <Link
        href={`/products/${product.id}`}
        className="block rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-text"
      >
        <div className="aspect-square overflow-hidden rounded-lg bg-neutral-100">
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
          />
        </div>
        <div className="pt-3">
          <p className="truncate text-xs font-medium text-text-caption">
            {product.brand}
          </p>
          <h3 className="mt-1 line-clamp-2 min-h-10 text-sm leading-5 text-text transition-colors group-hover:text-text-secondary sm:text-[15px]">
            {product.name}
          </h3>
          <strong className="mt-2 block text-base font-bold tabular-nums tracking-[-0.02em] text-text">
            {formatWon(product.price)}
          </strong>
          {product.originalPrice && (
            <span className="mt-0.5 block text-xs tabular-nums text-text-caption line-through">
              {formatWon(product.originalPrice)}
            </span>
          )}
        </div>
      </Link>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => toggleWishlist(product.id)}
          aria-pressed={isWished}
          aria-label={`${product.name} ${isWished ? '찜 해제' : '찜하기'}`}
          className={`min-h-11 cursor-pointer rounded-lg border px-3 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text ${
            isWished
              ? 'border-accent text-accent'
              : 'border-border text-text-secondary hover:border-neutral-400 hover:text-text'
          }`}
        >
          {isWished ? '찜 해제' : '찜하기'}
        </button>
        <button
          type="button"
          onClick={() => addItem(product.id)}
          aria-label={`${product.name} 장바구니에 담기`}
          className="min-h-11 cursor-pointer rounded-lg border border-border px-3 text-xs font-semibold text-text-secondary transition-colors hover:border-neutral-400 hover:text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text"
        >
          담기
        </button>
      </div>
    </article>
  );
}
