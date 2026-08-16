import {
  DEFAULT_PAGE_SIZE,
  type ProductFilterState,
  type RawSearchParams,
  parseFilterParams,
} from '@/features/product-filter';

import { PRODUCT_LIST_SCENARIOS, type ProductListQuery, type ProductListScenario } from './types';

const first = (value: string | string[] | undefined): string | undefined => (Array.isArray(value) ? value[0] : value);

const toScenario = (value: string | undefined): ProductListScenario | undefined =>
  PRODUCT_LIST_SCENARIOS.find((scenario) => scenario === value);

/**
 * 필터가 고른 값에 조회하는 쪽이 아는 값(pageSize, scenario)을 붙여 조회 조건을 만든다.
 *
 * 클라이언트(nuqs 결과)와 서버(searchParams) 양쪽이 이 함수를 통과하므로
 * metadata 와 본문이 같은 query key, 같은 GET URL 을 만든다.
 */
export function toProductListQuery(filter: ProductFilterState, scenario?: ProductListScenario): ProductListQuery {
  return {
    q: filter.q,
    category: filter.category,
    sort: filter.sort,
    page: filter.page,
    pageSize: DEFAULT_PAGE_SIZE,
    scenario,
  };
}

/** 서버 진입점. 원시 searchParams 하나로 조회 조건까지 한 번에 만든다. */
export function toProductListQueryFromSearchParams(params: RawSearchParams): ProductListQuery {
  return toProductListQuery(parseFilterParams(params), toScenario(first(params.scenario)));
}
