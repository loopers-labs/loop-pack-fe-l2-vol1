import Image from 'next/image';
import type { Product } from '@/types/commerce';

type Props = {
  product: Product;
};

export function ProductCard({ product }: Props) {
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
      <div>
        <button
          type="button"
          aria-label={`${product.name} 위시리스트`}
          aria-pressed={false}
        >
          찜
        </button>
        <button
          type="button"
          aria-label={`${product.name} 장바구니`}
          aria-pressed={false}
        >
          담기
        </button>
      </div>
    </article>
  );
}
