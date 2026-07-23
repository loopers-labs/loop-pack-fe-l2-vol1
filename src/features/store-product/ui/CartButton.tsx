import { Product } from '@/types/commerce';
import { useCartStore, useIsInCart } from '../store/cart';

export const CartButton = ({ product }: { product: Product }) => {
  const toggle = useCartStore((state) => state.toggle);
  const isInCart = useIsInCart(product.id);

  const handleClick = () => {
    toggle({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
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
