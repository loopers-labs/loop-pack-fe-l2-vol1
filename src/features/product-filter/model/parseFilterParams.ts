import type { ProductSort } from '@/entities/product';

import { CATEGORY_FILTER_VALUES, type CategoryFilter, PRODUCT_SORT_VALUES } from '../config/filters';

/** 사용자가 고른 필터 조건. nuqs 파서가 URL 에서 읽어 내는 것과 같은 모양이다. */
export type ProductFilterState = {
  q: string;
  category: CategoryFilter;
  sort: ProductSort;
  page: number;
};

/** Next 의 searchParams 와 같은 모양. 같은 키가 여러 번 오면 배열이 된다. */
export type RawSearchParams = Record<string, string | string[] | undefined>;

export const DEFAULT_FILTER_STATE: ProductFilterState = {
  q: '',
  category: 'all',
  sort: 'latest',
  page: 1,
};

const first = (value: string | string[] | undefined): string | undefined => (Array.isArray(value) ? value[0] : value);

const oneOf = <T extends string>(values: readonly T[], value: string | undefined, fallback: T): T =>
  values.some((allowed) => allowed === value) ? (value as T) : fallback;

/**
 * 원시 search params 를 검증된 필터 조건으로 정규화한다.
 *
 * 클라이언트는 nuqs 로 같은 일을 하지만 서버에는 nuqs 가 없다.
 * metadata 와 본문이 같은 조회 조건을 만들려면 서버도 같은 규칙으로 읽어야 하므로,
 * 파서 정의와 선택지 배열은 감춘 채 이 순수 함수만 공개한다.
 *
 * 허용하지 않는 값은 조용히 기본값으로 떨어뜨린다. 잘못된 조건으로 조회해
 * 400 을 받는 것보다 기본 목록을 보여주는 편이 낫고, 실제 조회 결과의 정합은
 * Route Handler 가 다시 검증한다.
 */
export function parseFilterParams(params: RawSearchParams): ProductFilterState {
  const page = Number(first(params.page));

  return {
    q: first(params.q)?.trim() ?? DEFAULT_FILTER_STATE.q,
    category: oneOf(CATEGORY_FILTER_VALUES, first(params.category), DEFAULT_FILTER_STATE.category),
    sort: oneOf(PRODUCT_SORT_VALUES, first(params.sort), DEFAULT_FILTER_STATE.sort),
    page: Number.isSafeInteger(page) && page >= 1 ? page : DEFAULT_FILTER_STATE.page,
  };
}
