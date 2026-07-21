import Image from 'next/image';

import type { Product } from '@/types/commerce';

export function ProductCard({
  product,
  headingLevel: Heading,
}: {
  product: Product;
  headingLevel: 'h2' | 'h3';
}) {
  return (
    <article className="week05-product">
      <Image
        className="week05-image"
        src={product.image}
        alt={product.name}
        width={400}
        height={400}
      />
      <p className="week05-brand">{product.brand}</p>
      <Heading className="week05-name">{product.name}</Heading>
      <div className="week05-price">
        <strong>{product.price.toLocaleString()}원</strong>
        {product.originalPrice !== null && (
          <span className="week05-original">
            {product.originalPrice.toLocaleString()}원
          </span>
        )}
      </div>
    </article>
  );
}
