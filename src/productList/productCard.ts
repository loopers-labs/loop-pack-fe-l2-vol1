import type { Product } from './types';
import { formatWon, isWithinDays } from './utils';

// 상품(서버 데이터)만으로 계산되는 카드 표시 규칙
export function getProductCardInfo(product: Product) {
  const discountRate = product.originalPrice
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : 0;

  return {
    discountRate,
    formattedPrice: formatWon(product.price),
    formattedOriginal: product.originalPrice
      ? formatWon(product.originalPrice)
      : null,
    isSoldOut: product.stock === 0,
    isAlmostSoldOut: product.stock > 0 && product.stock <= 5,
    isHot: discountRate >= 30,
    isBest: product.rating >= 4.5 && product.reviewCount >= 100,
    isFreeShipping: product.price >= 50_000,
    isNew: isWithinDays(product.createdAt, 7),
  };
}
