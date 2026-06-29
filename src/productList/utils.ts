import type { Product, ProductBadges } from "./types";

// ─── 도메인 규칙 임계값 ──────────────────────────────────
const HOT_DEAL_MIN_DISCOUNT_RATE = 30;
const BEST_MIN_RATING = 4.5;
const BEST_MIN_REVIEW_COUNT = 100;
const ALMOST_SOLD_OUT_THRESHOLD = 5;
const FREE_SHIPPING_THRESHOLD = 50000;
const NEW_PRODUCT_MAX_DAYS = 7;
const MS_PER_DAY = 1000 * 60 * 60 * 24;

/** 가격을 "289,000원" 형태로 포맷한다. */
export function formatPrice(price: number): string {
  return `${price.toLocaleString()}원`;
}

/** 정가 대비 할인율(%)을 반올림해 반환한다. 정가가 없으면 0. */
export function calculateDiscountRate(
  price: number,
  originalPrice?: number,
): number {
  if (!originalPrice) return 0;
  return Math.round((1 - price / originalPrice) * 100);
}

/** 생성일로부터 경과한 일수를 반환한다. now 는 테스트를 위해 주입 가능. */
export function getDaysSince(isoDate: string, now: Date = new Date()): number {
  const created = new Date(isoDate).getTime();
  return Math.floor((now.getTime() - created) / MS_PER_DAY);
}

/** 생성된 지 7일 이내면 신상품으로 본다. */
export function isNewProduct(isoDate: string, now: Date = new Date()): boolean {
  return getDaysSince(isoDate, now) <= NEW_PRODUCT_MAX_DAYS;
}

/** 상품 카드 배지/상태를 한 번에 계산한다. */
export function getProductBadges(
  product: Product,
  now: Date = new Date(),
): ProductBadges {
  const discountRate = calculateDiscountRate(
    product.price,
    product.originalPrice,
  );

  return {
    discountRate,
    isNew: isNewProduct(product.createdAt, now),
    isHotDeal: discountRate >= HOT_DEAL_MIN_DISCOUNT_RATE,
    isBest:
      product.rating >= BEST_MIN_RATING &&
      product.reviewCount >= BEST_MIN_REVIEW_COUNT,
    isSoldOut: product.stock === 0,
    isAlmostSoldOut:
      product.stock > 0 && product.stock <= ALMOST_SOLD_OUT_THRESHOLD,
    isFreeShipping: product.price >= FREE_SHIPPING_THRESHOLD,
  };
}

/** 재고 있는 것만 보기 토글에 따라 보여줄 상품을 추린다(파생값 — state 아님). */
export function getVisibleProducts(
  products: Product[],
  inStockOnly: boolean,
): Product[] {
  return inStockOnly ? products.filter((p) => p.stock > 0) : products;
}

/** 전체 개수와 페이지 크기로 총 페이지 수를 계산한다(최소 1). */
export function getTotalPages(totalCount: number, pageSize: number): number {
  return Math.max(1, Math.ceil(totalCount / pageSize));
}

/** 현재 페이지 주변(±range)의 노출할 페이지 번호 목록을 만든다. */
export function getPageNumbers(
  currentPage: number,
  totalPages: number,
  range = 2,
): number[] {
  const start = Math.max(1, currentPage - range);
  const end = Math.min(totalPages, currentPage + range);
  const pages: number[] = [];
  for (let page = start; page <= end; page++) pages.push(page);
  return pages;
}

const REGEXP_SPECIAL_CHARS = /[.*+?^${}()|[\]\\]/g;

/** 정규식 특수문자를 이스케이프해 검색어를 안전하게 패턴으로 쓸 수 있게 한다. */
function escapeRegExp(value: string): string {
  return value.replace(REGEXP_SPECIAL_CHARS, "\\$&");
}

export type HighlightPart = {
  text: string;
  isMatch: boolean;
};

/**
 * 텍스트를 검색어 일치/비일치 조각으로 쪼갠다.
 * 검색어를 escape 하므로 "(" 같은 정규식 특수문자도 안전하다.
 */
export function splitHighlightParts(
  text: string,
  query: string,
): HighlightPart[] {
  if (!query) return [{ text, isMatch: false }];

  const pattern = new RegExp(`(${escapeRegExp(query)})`, "gi");
  return text
    .split(pattern)
    .filter((part) => part !== "")
    .map((part) => ({
      text: part,
      isMatch: part.toLowerCase() === query.toLowerCase(),
    }));
}
