// [AI] 상품 카드. 홈과 상품 목록 양쪽에서 공통으로 사용한다.
// 전역 CSS(globals.css의 .product/.image)로 스타일링하고 찜/장바구니 버튼을 통합한다.
import Image from 'next/image';

import type { Product } from '@/types/commerce';
import { CartButton } from '../../store-product/ui/CartButton';
import { WishlistButton } from '../../store-product/ui/WishlistButton';

export const ProductCard = ({ product }: { product: Product }) => {
  return (
    <article className="product">
      <Image className="image" src={product.image} alt={product.name} width={400} height={400} />
      <p>{product.brand}</p>
      <h2>{product.name}</h2>
      <strong>{product.price.toLocaleString()}원</strong>
      <div>
        <WishlistButton product={product} />
        <CartButton product={product} />
      </div>
    </article>
  );
};
