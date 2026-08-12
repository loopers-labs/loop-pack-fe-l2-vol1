import {
  createLoader,
  parseAsString,
  parseAsInteger,
  parseAsStringLiteral,
} from 'nuqs/server';
import type { ProductListQuery } from '@/types/commerce';

export const CATEGORIES = [
  'all',
  'casual',
  'fashion',
  'goods',
  'home',
  'digital',
] as const;
export const SORTS = ['latest', 'popular', 'price-asc', 'price-desc'] as const;

// URL 정규화의 단일 소스 — 클라이언트 훅(useProductFilters)과
// 서버(generateMetadata·본문 prefetch)가 같은 파서를 쓴다.
// 잘못된 값은 기본값으로 정규화되므로 metadata와 본문이 같은 query key·GET URL을 만든다.
export const productFilterParsers = {
  q: parseAsString.withDefault(''),
  category: parseAsStringLiteral(CATEGORIES).withDefault('all'),
  sort: parseAsStringLiteral(SORTS).withDefault('latest'),
  page: parseAsInteger.withDefault(1),
};

// 서버에서 searchParams → 정규화된 필터 (nuqs 파서 그대로 재사용)
export const loadProductFilters = createLoader(productFilterParsers);

export type ProductFilters = ProductListQuery & {
  q: string;
  category: (typeof CATEGORIES)[number];
  sort: (typeof SORTS)[number];
  page: number;
};
