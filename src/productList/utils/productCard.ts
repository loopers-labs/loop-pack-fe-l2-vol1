import type { Product } from "../types";

const LOW_STOCK_THRESHOLD = 5; // 이하면 '품절 임박'
const HOT_DISCOUNT_RATE = 30; // 이상이면 '특가'
const BEST_MIN_RATING = 4.5;
const BEST_MIN_REVIEWS = 100;
const FREE_SHIPPING_MIN_PRICE = 50000;
const NEW_PRODUCT_DAYS = 7;

const getDiscountRate = (product: Product) => {
  return product.originalPrice
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : 0;
};

export const getProductBadges = (product: Product, now: Date) => {
  const discountRate = getDiscountRate(product);
  const isAlmostSoldOut =
    product.stock > 0 && product.stock <= LOW_STOCK_THRESHOLD;
  const isSoldOut = product.stock === 0;
  const isHot = discountRate >= HOT_DISCOUNT_RATE;
  const isBest =
    product.rating >= BEST_MIN_RATING &&
    product.reviewCount >= BEST_MIN_REVIEWS;
  const isFreeShipping = product.price >= FREE_SHIPPING_MIN_PRICE;

  const createdDate = new Date(product.createdAt);
  const daysSinceCreated = Math.floor(
    (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24),
  );
  const isNew = daysSinceCreated <= NEW_PRODUCT_DAYS;

  return {
    discountRate,
    isAlmostSoldOut,
    isSoldOut,
    isHot,
    isBest,
    isFreeShipping,
    isNew,
  };
};

export const formatPrice = (n: number) => {
  return n.toLocaleString() + "원";
};
