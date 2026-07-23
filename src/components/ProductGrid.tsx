'use client';

import Image from 'next/image';
import type { Product } from '@/types/commerce';
import {
  useIsInCart,
  useIsWished,
  useToggleCart,
  useToggleWish,
} from '@/stores/shopStore';

function ProductCard({ product }: { product: Product }) {
  const inCart = useIsInCart(product.id);
  const wished = useIsWished(product.id);
  const toggleCart = useToggleCart();
  const toggleWish = useToggleWish();

  return (
    <article className="week05-product">
      <Image
        className="week05-image"
        src={product.image}
        alt={product.name}
        width={400}
        height={400}
      />
      <p>{product.brand}</p>
      <h3>{product.name}</h3>
      <strong>{product.price.toLocaleString()}원</strong>
      <div>
        <button
          type="button"
          aria-pressed={wished}
          aria-label={`${product.name} 위시리스트`}
          onClick={() => toggleWish(product.id)}
        >
          {wished ? '♥ 찜' : '♡ 찜'}
        </button>
        <button
          type="button"
          aria-pressed={inCart}
          aria-label={`${product.name} 장바구니`}
          onClick={() => toggleCart(product.id)}
        >
          {inCart ? '빼기' : '담기'}
        </button>
      </div>
    </article>
  );
}

export function ProductGrid({ products }: { products: Product[] }) {
  return (
    <div className="week05-grid">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
