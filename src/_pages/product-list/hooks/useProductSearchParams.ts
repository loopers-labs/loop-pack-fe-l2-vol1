'use client';

import {
  useQueryStates,
  parseAsString,
  parseAsStringLiteral,
  parseAsInteger,
} from 'nuqs';
import {
  CATEGORY_OPTIONS,
  PRODUCT_SORTS,
} from '@/entities/product/model/types';
import type { CategoryOption, ProductListQuery, ProductSort } from '@/entities/product/model/types';

const searchParamsParsers = {
  q: parseAsString.withDefault(''),
  category: parseAsStringLiteral(CATEGORY_OPTIONS).withDefault('all'),
  sort: parseAsStringLiteral(PRODUCT_SORTS).withDefault('latest'),
  page: parseAsInteger.withDefault(1),
};

const nuqsOptions = { history: 'push' as const };

export function useProductSearchParams() {
  const [params, setParams] = useQueryStates(searchParamsParsers, nuqsOptions);

  const setCategory = (category: CategoryOption) => {
    void setParams({ category, page: 1 });
  };

  const setSort = (sort: ProductSort) => {
    void setParams({ sort, page: 1 });
  };

  const setSearch = (q: string) => {
    void setParams({ q: q || '', page: 1 });
  };

  const setPage = (page: number) => {
    void setParams({ page });
  };

  const query: ProductListQuery = {
    q: params.q || undefined,
    category: params.category,
    sort: params.sort,
    page: params.page,
  };

  return {
    params,
    query,
    setCategory,
    setSort,
    setSearch,
    setPage,
  };
}
