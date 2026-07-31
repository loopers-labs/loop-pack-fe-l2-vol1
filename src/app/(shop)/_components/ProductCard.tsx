'use client';

import type { Product } from '@/types/commerce';
import Image from 'next/image';

import { useCommerceStore } from '@/store/useCommerceStore';

/**
 * 홈·목록 공용 상품 카드.
 */
export function ProductCard({ product }: { product: Product }) {
  const wishList = useCommerceStore((state) => state.wishlist);
  const cart = useCommerceStore((state) => state.cart);
  const toggleWishlist = useCommerceStore((state) => state.toggleWishlist);
  const toggleCart = useCommerceStore((state) => state.toggleCart);

  const isWished = wishList.includes(product.id);
  const isInCart = cart.includes(product.id);

  return (
    <article className="week05-product">
      <Image className="week05-image" src={product.image} alt={product.name} width={400} height={400} loading="eager" />
      <p>{product.brand}</p>
      <h3>{product.name}</h3>
      <strong>
        {product.price.toLocaleString('ko-KR')}원
        {product.originalPrice !== null && (
          <s style={{ marginLeft: 8, color: '#8794a3', fontWeight: 400 }}>
            {product.originalPrice.toLocaleString('ko-KR')}원
          </s>
        )}
      </strong>
      <div>
        <button
          type="button"
          aria-label={`${product.name} 위시리스트`}
          aria-pressed={isWished}
          onClick={() => toggleWishlist(product.id)}
        >
          {isWished ? '찜 해제' : '찜'}
        </button>
        <button
          type="button"
          aria-label={`${product.name} 장바구니`}
          aria-pressed={isInCart}
          onClick={() => toggleCart(product.id)}
        >
          {isInCart ? '담김' : '담기'}
        </button>
      </div>
    </article>
  );
}
