import type { Product } from '../types/product';

const NEW_DAYS = 7;
const HOT_DISCOUNT_RATE = 30;
const BEST_RATING = 4.5;
const BEST_REVIEW_COUNT = 100;
const FREE_SHIPPING_MIN = 50000;
const LOW_STOCK = 5;
const DAY_MS = 1000 * 60 * 60 * 24;

export const getDiscountRate = (product: Product): number =>
  product.originalPrice
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : 0;

export const isSoldOut = (product: Product): boolean => product.stock === 0;

export const isAlmostSoldOut = (product: Product): boolean =>
  product.stock > 0 && product.stock <= LOW_STOCK;

export const isHot = (product: Product): boolean =>
  getDiscountRate(product) >= HOT_DISCOUNT_RATE;

export const isBest = (product: Product): boolean =>
  product.rating >= BEST_RATING && product.reviewCount >= BEST_REVIEW_COUNT;

export const isNew = (product: Product): boolean => {
  const days = Math.floor(
    (Date.now() - new Date(product.createdAt).getTime()) / DAY_MS,
  );
  return days <= NEW_DAYS;
};

export const isFreeShipping = (product: Product): boolean =>
  product.price >= FREE_SHIPPING_MIN;
