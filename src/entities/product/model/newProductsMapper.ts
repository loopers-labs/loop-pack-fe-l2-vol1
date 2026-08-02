import type { Product } from './product';

/* AI-generated : week06-fsd.md 6단계 기준 — 홈 응답의 존재를 모르는 순수 함수 */
export const newProductsMapper = (res: { newProducts: Product[] }): Product[] => res.newProducts;
