import { type ReactNode } from 'react';

import Image from 'next/image';

import type { Product } from '../model/product';

/**
 * 홈·목록 공용 상품 카드.
 *
 * 상품을 "어떻게 보여줄지"만 안다. 담기·찜 같은 사용자 행위는 features 소관이라
 * 여기서 알면 entities -> features 역방향 의존이 된다.
 * 행위 UI 는 actions 슬롯으로 받고, 무엇을 꽂을지는 상위(page/widget)가 정한다.
 */
type ProductCardProps = {
  product: Product;
  actions?: ReactNode;
};

export function ProductCard({ product, actions }: ProductCardProps) {
  return (
    <article className="week05-product">
      <Image className="week05-image" src={product.image} alt={product.name} width={400} height={400} loading="eager" />
      <p>{product.brand}</p>
      <h3>{product.name}</h3>
      <strong>
        {product.price.toLocaleString('ko-KR')}원
        {product.originalPrice !== null && (
          <s style={{ marginLeft: 8, color: '#8794a3', fontWeight: 400 }}>
            {product.originalPrice.toLocaleString('ko-KR')}원
          </s>
        )}
      </strong>
      {actions !== undefined && <div>{actions}</div>}
    </article>
  );
}
