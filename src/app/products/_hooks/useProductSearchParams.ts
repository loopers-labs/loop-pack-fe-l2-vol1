'use client';

import {
  useQueryStates,
  parseAsString,
  parseAsInteger,
} from 'nuqs';
import type { ProductListQuery } from '@/types/commerce';

const searchParamsParsers = {
  q: parseAsString.withDefault(''),
  category: parseAsString.withDefault('all'),
  sort: parseAsString.withDefault('latest'),
  page: parseAsInteger.withDefault(1),
};

const nuqsOptions = { history: 'push' as const };

export function useProductSearchParams() {
  const [params, setParams] = useQueryStates(searchParamsParsers, nuqsOptions);

  const setCategory = (category: string) => {
    void setParams({ category, page: 1 });
  };

  const setSort = (sort: string) => {
    void setParams({ sort, page: 1 });
  };

  const setSearch = (q: string) => {
    void setParams({ q, page: 1 });
  };

  const setPage = (page: number) => {
    void setParams({ page });
  };

  const query: ProductListQuery = {
    q: params.q || undefined,
    category: params.category as ProductListQuery['category'],
    sort: params.sort as ProductListQuery['sort'],
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
