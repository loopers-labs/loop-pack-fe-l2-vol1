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

/**
 * 카드가 실제로 차지하는 폭. `week-05-layout.css` 의 그리드와 같아야 한다.
 * 열 수는 960px·720px 에서 5 -> 3 -> 2 로 바뀌고, 페이지는 좌우 여백 32px 에 최대 1200px 다.
 *
 * 이 값이 없으면 next/image 는 레이아웃을 모른 채 width prop 의 1x·2x 로만 후보를 잡아,
 * 184px 로 그려질 카드에 828px 짜리를 내려보낸다.
 */
const CARD_SIZES = ['(max-width: 720px) 50vw', '(max-width: 960px) 34vw', '20vw'].join(', ');

export function ProductCard({ product, actions }: ProductCardProps) {
  return (
    <article className="week05-product">
      <Image
        className="week05-image"
        src={product.image}
        alt={product.name}
        width={400}
        height={400}
        sizes={CARD_SIZES}
        loading="eager"
      />
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
