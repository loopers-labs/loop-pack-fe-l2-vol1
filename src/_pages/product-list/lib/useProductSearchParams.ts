'use client';

import { useTransition } from 'react';
import { useQueryStates } from 'nuqs';
import type { CategoryOption, ProductListQuery, ProductSort } from '@/entities/product/model/types';
import { searchParamsParsers } from '@/entities/product/lib/searchParamsParsers';

const nuqsOptions = { history: 'push' as const };

export function useProductSearchParams() {
  const [params, setParams] = useQueryStates(searchParamsParsers, nuqsOptions);
  const [isPending, startTransition] = useTransition();

  const setCategory = (category: CategoryOption) => {
    startTransition(() => {
      void setParams({ category, page: 1 });
    });
  };

  const setSort = (sort: ProductSort) => {
    startTransition(() => {
      void setParams({ sort, page: 1 });
    });
  };

  const setSearch = (q: string) => {
    startTransition(() => {
      void setParams({ q: q || '', page: 1 });
    });
  };

  const setPage = (page: number) => {
    startTransition(() => {
      void setParams({ page });
    });
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
    isPending,
    setCategory,
    setSort,
    setSearch,
    setPage,
  };
}
