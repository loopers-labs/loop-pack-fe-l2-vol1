import Image from 'next/image';
import type { ReactNode } from 'react';
import type { Product } from '@/entities/product/model/product';

type ProductCardProps = {
  /** 카드에 표시할 상품 데이터 */
  product: Product;
  /** 찜/담기 같은 행위 버튼 영역. entity는 어떤 행위가 오는지 모른다 */
  children?: ReactNode;
};

/* AI-generated : week06-fsd.md 3단계 기준 — 순수 상품 표현만 담당, 행위는 children으로 조합 */
export function ProductCard({ product, children }: ProductCardProps) {
  return (
    <article className="week05-product">
      <Image
        className="week05-image"
        src={product.image}
        alt={product.name}
        width={400}
        height={400}
      />
      <p>{product.brand}</p>
      <h3>{product.name}</h3>
      <strong>{product.price.toLocaleString()}원</strong>
      <div>{children}</div>
    </article>
  );
}
