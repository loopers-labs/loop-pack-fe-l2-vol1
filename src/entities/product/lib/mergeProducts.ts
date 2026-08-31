import type { Product } from '@/entities/product/model/types';

export function mergeProducts(
  pages: readonly { products: readonly Product[] }[],
): Product[] {
  const productsById = new Map<string, Product>();

  pages.forEach((page) => {
    page.products.forEach((product) => {
      productsById.set(product.id, product);
    });
  });

  return Array.from(productsById.values());
}
