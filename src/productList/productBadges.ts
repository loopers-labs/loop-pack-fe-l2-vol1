import type { Product } from "./types.ts";

const MS_PER_DAY = 1000 * 60 * 60 * 24;

export type ProductBadges = {
  discountRate: number;
  isNew: boolean;
  isHot: boolean;
  isBest: boolean;
  isSoldOut: boolean;
  isAlmostSoldOut: boolean;
  isFreeShipping: boolean;
};

/**
 * 상품 카드에 표시할 배지·플래그를 계산한다.
 * `now`는 호출부에서 주입한다(결정론적 계산을 위해 내부에서 현재 시각을 읽지 않음).
 */
export function computeBadges(product: Product, now: Date): ProductBadges {
  const discountRate = product.originalPrice
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : 0;
  const daysSinceCreated = Math.floor((now.getTime() - Date.parse(product.createdAt)) / MS_PER_DAY);
  const isSoldOut = product.stock === 0;

  return {
    discountRate,
    isNew: daysSinceCreated <= 7,
    isHot: discountRate >= 30,
    isBest: product.rating >= 4.5 && product.reviewCount >= 100,
    isSoldOut,
    isAlmostSoldOut: !isSoldOut && product.stock <= 5,
    isFreeShipping: product.price >= 50000,
  };
}
