/**
 * 상품 뱃지 도메인 규칙
 * - 분리 기준: 카드 렌더 안에 boolean 파생값들과 매직넘버들이 인라인으로 산재했습니다. 계산 로직은 어떤 계산인지 의도를 분명히 하기 위해 동일한 파일 내에, 순수함수로 분리하였고,
 *   getDiscountRate/isNewProduct/getStockStatus는 export하지 않았습니다. 정책 관련 매직넘버들은 상수로 선언하였습니다.
 */
import type { Product } from '../types';

const HOT_DISCOUNT_RATE = 30;
const BEST_RATING = 4.5;
const BEST_REVIEW_COUNT = 100;
const ALMOST_SOLD_OUT_STOCK = 5;
const NEW_PRODUCT_DAYS = 7;
const DAY_MS = 1000 * 60 * 60 * 24;

export type ProductBadgeType = 'discount' | 'new' | 'hot' | 'best' | 'soldout' | 'warning';

export interface ProductBadgeInfo {
  type: ProductBadgeType;
  label: string;
}

const getDiscountRate = (price: number, originalPrice?: number): number =>
  originalPrice ? Math.round((1 - price / originalPrice) * 100) : 0;

const isNewProduct = (createdAt: string, now: number): boolean =>
  Math.floor((now - new Date(createdAt).getTime()) / DAY_MS) <= NEW_PRODUCT_DAYS;

type StockStatus = 'soldout' | 'almost' | 'ok';

const getStockStatus = (stock: number): StockStatus =>
  stock === 0 ? 'soldout' : stock <= ALMOST_SOLD_OUT_STOCK ? 'almost' : 'ok';

const STOCK_BADGE: Record<StockStatus, ProductBadgeInfo | null> = {
  soldout: { type: 'soldout', label: '품절' },
  almost: { type: 'warning', label: '품절 임박' },
  ok: null,
};

/**
 * 상품이 노출할 뱃지 목록을 계산하는 함수로 Page 컴포넌트 내의 인라인 계산 로직을 분리하였습니다.
 */
export const getProductBadges = (product: Product, now: number = Date.now()): ProductBadgeInfo[] => {
  const discountRate = getDiscountRate(product.price, product.originalPrice);

  const badges: ProductBadgeInfo[] = [];

  if (discountRate > 0) badges.push({ type: 'discount', label: `${discountRate}% 할인` });
  if (isNewProduct(product.createdAt, now)) badges.push({ type: 'new', label: 'NEW' });
  if (discountRate >= HOT_DISCOUNT_RATE) badges.push({ type: 'hot', label: '특가' });
  if (product.rating >= BEST_RATING && product.reviewCount >= BEST_REVIEW_COUNT) {
    badges.push({ type: 'best', label: 'BEST' });
  }

  const stockBadge = STOCK_BADGE[getStockStatus(product.stock)];

  if (stockBadge) badges.push(stockBadge);

  return badges;
};
