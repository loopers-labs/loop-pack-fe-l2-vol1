import { Product } from '@/entities/product/model';
import { track } from '@/analytics/logger';
import { useCartStore, useIsInCart } from '../model/store';

export const CartButton = ({ product }: { product: Product }) => {
  const toggle = useCartStore((state) => state.toggle);
  const isInCart = useIsInCart(product.id);

  const handleClick = () => {
    if (!isInCart) {
      track('cart_add', { productId: product.id });
    }
    toggle({
      id: product.id,
    });
  };

  return (
    <button
      type="button"
      aria-label={`${product.name} 장바구니`}
      aria-pressed={false}
      onClick={handleClick}
    >
      {isInCart ? '담기 해제' : '담기'}
    </button>
  );
};
