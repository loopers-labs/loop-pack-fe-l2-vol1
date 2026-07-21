'use client';

import { Product } from '@/types/commerce';
import { useIsInWishlist, useWishlistStore } from '../store/store';

export const WishlistButton = ({ product }: { product: Product }) => {
  const toggle = useWishlistStore((state) => state.toggle);
  const isInWishlist = useIsInWishlist(product.id);

  // TODO: 꼭 필요한 필드 이외의 필드가 포함된 product 전체를 전달할 때 타입 단계에서 에러를 발생시키는 방법?
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
      aria-label={`${product.name} 위시리스트`}
      aria-pressed={false}
      onClick={handleClick}
    >
      {isInWishlist ? '찜 해제' : '찜'}
    </button>
  );
};
