// [AI] 상품 카드 표현(entity). 홈과 상품 목록 양쪽에서 공통으로 사용한다.
// entities는 features를 모르게 한다 — 찜/장바구니 버튼은 actions slot으로 주입받고
// 조합은 widgets/product-card에서 담당한다(역방향 의존 방지).
import type { ReactNode } from 'react';
import Image from 'next/image';

import type { Product } from '@/entities/product/model';

export const ProductCard = ({ product, actions }: { product: Product; actions?: ReactNode }) => {
  return (
    <article className="product">
      <Image className="image" src={product.image} alt={product.name} width={400} height={400} />
      <p>{product.brand}</p>
      <h2>{product.name}</h2>
      <strong>{product.price.toLocaleString()}원</strong>
      {actions ? <div>{actions}</div> : null}
    </article>
  );
};
