import type { Product } from '../shared';

export const getProductStockStatus = (product: Product) => {
  const isAlmostSoldOut = product.stock > 0 && product.stock <= 5;
  const isSoldOut = product.stock === 0;

  return { isAlmostSoldOut, isSoldOut };
};
