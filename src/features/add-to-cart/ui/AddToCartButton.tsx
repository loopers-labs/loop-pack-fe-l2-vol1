'use client';

import { useAddToCart } from '../model/useAddToCart';

/**
 * 상품을 장바구니에 담고 빼는 버튼.
 *
 * 담기 규칙과 계측은 useAddToCart 가 갖는다. 이 파일은 무엇을 보여줄지만 정한다.
 *
 * cart 엔티티만 안다. 위시리스트 feature 와는 서로를 모르며,
 * 둘을 나란히 보여줘야 한다면 상위(page/widget)에서 조합한다.
 * 담김 여부는 저장하지 않고 목록에서 파생한다.
 */
type AddToCartButtonProps = {
  productId: string;
  productName: string;
};

export function AddToCartButton({ productId, productName }: AddToCartButtonProps) {
  const { isInCart, toggle } = useAddToCart(productId);

  return (
    <button type="button" aria-label={`${productName} 장바구니`} aria-pressed={isInCart} onClick={toggle}>
      {isInCart ? '담김' : '담기'}
    </button>
  );
}
