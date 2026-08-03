'use client';
import Image from 'next/image';
import type { Product } from '@/entities/product/model';
import { useCartStore } from '@/entities/cart/model/cartStore';
import { useWishlistStore } from '@/entities/wishlist/model/wishlistStore';

type Props = {
  product: Product;
};

export function ProductCard({ product }: Props) {
  const isInWishlist = useWishlistStore((state) =>
    state.items.includes(product.id),
  );
  const toggleWishlist = useWishlistStore((state) => state.toggleItem);
  const isInCart = useCartStore((state) => state.items.includes(product.id));
  const addToCart = useCartStore((state) => state.addItem);
  const removeFromCart = useCartStore((state) => state.removeItem);

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
          onClick={() => toggleWishlist(product.id)}
        >
          찜
        </button>
        <button
          type="button"
          aria-label={`${product.name} 장바구니`}
          aria-pressed={isInCart}
          onClick={() =>
            isInCart ? removeFromCart(product.id) : addToCart(product.id)
          }
        >
          담기
        </button>
      </div>
    </article>
  );
}
