import {
  createParser,
  parseAsString,
  parseAsStringLiteral,
  createSearchParamsCache,
} from 'nuqs/server';
import {
  CATEGORY_OPTIONS,
  PRODUCT_SORTS,
} from '@/entities/product/model/types';
import { MOCK_API_SCENARIOS } from '@/shared/api/mockScenario';
import { parsePositiveInteger } from '@/shared/lib/parsePositiveInteger';

const parseAsPositiveInteger = createParser({
  parse: parsePositiveInteger,
  serialize: String,
}).withDefault(1);

export const searchParamsParsers = {
  q: parseAsString.withDefault(''),
  category: parseAsStringLiteral(CATEGORY_OPTIONS).withDefault('all'),
  sort: parseAsStringLiteral(PRODUCT_SORTS).withDefault('latest'),
  page: parseAsPositiveInteger,
  scenario: parseAsStringLiteral(MOCK_API_SCENARIOS),
};

export const searchParamsCache = createSearchParamsCache(searchParamsParsers);
