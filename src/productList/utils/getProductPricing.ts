import type { Product } from '../shared';

export const getProductPricing = (product: Product) => {
  const discountRate = product.originalPrice
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : 0;
  const formattedPrice = `${product.price.toLocaleString()}원`;
  const formattedOriginal = product.originalPrice
    ? `${product.originalPrice.toLocaleString()}원`
    : null;

  return { discountRate, formattedPrice, formattedOriginal };
};
