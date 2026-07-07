import type { Product } from "../types";

// 상품 하나에서 파생되는 배지/상태 플래그. UI가 아니라 "규칙"이라 순수 함수로 뺀다.
export type ProductBadges = {
  discountRate: number;
  isNew: boolean;
  isHot: boolean;
  isBest: boolean;
  isSoldOut: boolean;
  isAlmostSoldOut: boolean;
  isFreeShipping: boolean;
};

const NEW_WITHIN_DAYS = 7;
const HOT_DISCOUNT_RATE = 30;
const BEST_MIN_RATING = 4.5;
const BEST_MIN_REVIEWS = 100;
const FREE_SHIPPING_FROM = 50000;
const ALMOST_SOLD_OUT_STOCK = 5;
const DAY_MS = 1000 * 60 * 60 * 24;

export function deriveProductBadges(product: Product, now: Date = new Date()): ProductBadges {
  const discountRate = product.originalPrice
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : 0;

  const daysSinceCreated = Math.floor(
    (now.getTime() - new Date(product.createdAt).getTime()) / DAY_MS,
  );

  const isSoldOut = product.stock === 0;

  return {
    discountRate,
    isNew: daysSinceCreated <= NEW_WITHIN_DAYS,
    isHot: discountRate >= HOT_DISCOUNT_RATE,
    isBest: product.rating >= BEST_MIN_RATING && product.reviewCount >= BEST_MIN_REVIEWS,
    isSoldOut,
    isAlmostSoldOut: !isSoldOut && product.stock <= ALMOST_SOLD_OUT_STOCK,
    isFreeShipping: product.price >= FREE_SHIPPING_FROM,
  };
}
