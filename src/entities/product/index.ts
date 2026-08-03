/**
 * product 슬라이스 Public API.
 *
 * 외부가 알아야 하는 것은 카드 컴포넌트와 도메인 타입뿐이다.
 * ui/ · model/ 의 내부 파일 경로는 슬라이스 밖에서 참조하지 않는다.
 */
export { ProductCard } from './ui/ProductCard';
export type { Category, CategoryId, Product, ProductSort } from './model/product';
