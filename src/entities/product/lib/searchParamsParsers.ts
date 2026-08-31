import {
  parseAsString,
  parseAsStringLiteral,
  createSearchParamsCache,
} from 'nuqs/server';
import { CATEGORY_OPTIONS, PRODUCT_SORTS } from '@/entities/product/model/types';
import { MOCK_API_SCENARIOS } from '@/shared/api/mockScenario';

export const searchParamsParsers = {
  q: parseAsString.withDefault(''),
  category: parseAsStringLiteral(CATEGORY_OPTIONS).withDefault('all'),
  sort: parseAsStringLiteral(PRODUCT_SORTS).withDefault('latest'),
  scenario: parseAsStringLiteral(MOCK_API_SCENARIOS),
};

export const searchParamsCache = createSearchParamsCache(searchParamsParsers);
