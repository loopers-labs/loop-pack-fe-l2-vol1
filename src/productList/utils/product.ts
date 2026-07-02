import type { Product } from '../shared';

export const getProductBadges = (discountRate: number, product: Product) => {
  const isHot = discountRate >= 30;
  const isBest = product.rating >= 4.5 && product.reviewCount >= 100;
  const isFreeShipping = product.price >= 50000;

  const createdDate = new Date(product.createdAt);
  const now = new Date();
  const daysSinceCreated = Math.floor(
    (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  const isNew = daysSinceCreated <= 7;

  return { isHot, isBest, isFreeShipping, isNew };
};

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

export const getProductStockStatus = (product: Product) => {
  const isAlmostSoldOut = product.stock > 0 && product.stock <= 5;
  const isSoldOut = product.stock === 0;

  return { isAlmostSoldOut, isSoldOut };
};
