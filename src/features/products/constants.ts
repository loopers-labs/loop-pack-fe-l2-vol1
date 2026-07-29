import { CATEGORY_IDS } from '@/types/commerce';
import type { ProductSort } from '@/types/commerce';

export const PRODUCT_PAGE_SIZE = 12;

export const CATEGORY_FILTERS = ['all', ...CATEGORY_IDS] as const;

export type CategoryFilter = (typeof CATEGORY_FILTERS)[number];

export const CATEGORY_FILTER_LABEL: Record<CategoryFilter, string> = {
  all: '전체',
  casual: '캐주얼',
  fashion: '패션',
  goods: '뷰티·잡화',
  home: '홈',
  digital: '디지털',
};

export const PRODUCT_SORT_LABEL: Record<ProductSort, string> = {
  latest: '최신순',
  popular: '인기순',
  'price-asc': '낮은 가격순',
  'price-desc': '높은 가격순',
};
