import type { ReactNode } from 'react';
import type { Product } from '@/types/commerce';
import { ProductCard } from './ProductCard';

export function ProductGrid({
  products,
  renderActions,
}: {
  products: Product[];
  renderActions?: (product: Product) => ReactNode;
}) {
  return (
    <div className="week05-grid">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          actions={renderActions?.(product)}
        />
      ))}
    </div>
  );
}
