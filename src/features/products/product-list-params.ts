import {
  createLoader,
  createParser,
  type inferParserType,
  parseAsStringLiteral,
} from 'nuqs/server';

import { CATEGORY_FILTERS, PRODUCT_PAGE_SIZE } from './constants';

import { PRODUCT_SORTS } from '@/types/commerce';

// 주소로 직접 들어와도, 폼으로 제출해도 같은 규칙을 써야 같은 검색이 같은 캐시를 쓴다.
export const normalizeSearchQuery = (value: string) =>
  value.trim().normalize('NFC');

export const conditionParsers = {
  q: createParser({
    parse: normalizeSearchQuery,
    serialize: String,
  }).withDefault(''),

  category: parseAsStringLiteral(CATEGORY_FILTERS).withDefault('all'),
  sort: parseAsStringLiteral(PRODUCT_SORTS).withDefault('latest'),

  page: createParser({
    parse: (value: string) => {
      const page = Number(value);

      return Number.isSafeInteger(page) && page >= 1 ? page : null;
    },
    serialize: String,
  }).withDefault(1),
};

export type ProductListConditions = inferParserType<typeof conditionParsers>;

export const loadProductListConditions = createLoader(conditionParsers);

/**
 * pageSize는 URL에 없으므로 조회 직전에 더한다.
 * 서버와 브라우저가 이 함수를 같이 써야 queryKey가 갈라지지 않는다.
 */
export const toProductListQuery = (conditions: ProductListConditions) => ({
  ...conditions,
  pageSize: PRODUCT_PAGE_SIZE,
});
