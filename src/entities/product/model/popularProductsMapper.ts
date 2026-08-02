import type { Product } from './product';

/* AI-generated : week06-fsd.md 6단계 기준 — 홈 응답의 존재를 모르는 순수 함수. 필요한 필드 모양만 구조적으로 받는다 */
export const popularProductsMapper = (res: { popularProducts: Product[] }): Product[] =>
  res.popularProducts;
