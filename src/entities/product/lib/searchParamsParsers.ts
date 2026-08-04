import {
  parseAsString,
  parseAsStringLiteral,
  parseAsInteger,
  createSearchParamsCache,
} from 'nuqs/server';
import {
  CATEGORY_OPTIONS,
  PRODUCT_SORTS,
} from '@/entities/product/model/types';

export const searchParamsParsers = {
  q: parseAsString.withDefault(''),
  category: parseAsStringLiteral(CATEGORY_OPTIONS).withDefault('all'),
  sort: parseAsStringLiteral(PRODUCT_SORTS).withDefault('latest'),
  page: parseAsInteger.withDefault(1),
};

export const searchParamsCache = createSearchParamsCache(searchParamsParsers);
