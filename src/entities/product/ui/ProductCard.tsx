import Image from 'next/image';
import type { ReactNode } from 'react';
import type { Product } from '@/types/commerce';

// 상품 "표현"만 담당한다. 담기·찜 같은 행위는 actions 슬롯으로 받는다 —
// entities가 features를 import하는 역방향 의존을 원천 차단(조합은 상위 레이어에서).
export function ProductCard({
  product,
  actions,
}: {
  product: Product;
  actions?: ReactNode;
}) {
  return (
    <article className="week05-product">
      <Image
        className="week05-image"
        src={product.image}
        alt={product.name}
        width={400}
        height={400}
        style={{ height: 'auto' }}
      />
      <p>{product.brand}</p>
      <h3>{product.name}</h3>
      <strong>{product.price.toLocaleString()}원</strong>
      {actions ? <div>{actions}</div> : null}
    </article>
  );
}
