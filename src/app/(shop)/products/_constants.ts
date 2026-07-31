export const CATEGORY_FILTERS = [
  { value: 'all', label: '전체' },
  { value: 'casual', label: '캐주얼' },
  { value: 'fashion', label: '패션' },
  { value: 'goods', label: '뷰티·잡화' },
  { value: 'home', label: '홈' },
  { value: 'digital', label: '디지털' },
] as const;

export const CATEGORY_FILTER_VALUES = CATEGORY_FILTERS.map((item) => item.value);

export type CategoryFilter = (typeof CATEGORY_FILTER_VALUES)[number];

export const PRODUCT_SORTS = [
  { value: 'latest', label: '최신순' },
  { value: 'popular', label: '인기순' },
  { value: 'price-asc', label: '낮은 가격순' },
  { value: 'price-desc', label: '높은 가격순' },
] as const;

export const PRODUCT_SORT_VALUES = PRODUCT_SORTS.map((item) => item.value);

/**
 * 페이지네이션 기본 페이지 크기.
 */
export const DEFAULT_PAGE_SIZE = 12;
