'use client';
import type { Product } from '@/entities/product/model';
import { ProductCard as ProductCardBase } from '@/entities/product/ui/ProductCard';
import { useCartStore } from '@/entities/cart/model/cartStore';
import { useWishlistStore } from '@/entities/wishlist/model/wishlistStore';
import { track } from '@/analytics/logger';

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
    <ProductCardBase
      product={product}
      isInWishlist={isInWishlist}
      isInCart={isInCart}
      onToggleWishlist={() => toggleWishlist(product.id)}
      onAddToCart={() => {
        addToCart(product.id);
        track('cart_add', { productId: product.id, quantity: 1 });
      }}
      onRemoveFromCart={() => removeFromCart(product.id)}
    />
  );
}
