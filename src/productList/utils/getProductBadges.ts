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
