import type { CategoryFilter, SortBy } from './types';

export const CATEGORY_LABELS: Record<CategoryFilter, string> = {
  all: '전체',
  electronics: '전자제품',
  fashion: '패션',
  home: '홈',
  beauty: '뷰티',
};

export const SORT_LABELS: Record<SortBy, string> = {
  latest: '최신순',
  popular: '인기순',
  'price-asc': '가격 낮은순',
  'price-desc': '가격 높은순',
};

export const PAGE_SIZE = 12;
