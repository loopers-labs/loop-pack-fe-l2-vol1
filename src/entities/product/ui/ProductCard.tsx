'use client';
import Image from 'next/image';
import type { Product } from '@/entities/product/model';

type Props = {
  product: Product;
  isInWishlist: boolean;
  isInCart: boolean;
  onToggleWishlist: () => void;
  onAddToCart: () => void;
  onRemoveFromCart: () => void;
};

export function ProductCard({
  product,
  isInWishlist,
  isInCart,
  onToggleWishlist,
  onAddToCart,
  onRemoveFromCart,
}: Props) {
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
          aria-label={`${product.name} 위시리스트`}
          aria-pressed={isInWishlist}
          onClick={onToggleWishlist}
        >
          찜
        </button>
        <button
          type="button"
          aria-label={`${product.name} 장바구니`}
          aria-pressed={isInCart}
          onClick={isInCart ? onRemoveFromCart : onAddToCart}
        >
          담기
        </button>
      </div>
    </article>
  );
}
