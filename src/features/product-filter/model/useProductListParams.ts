'use client';

import { useQueryStates } from 'nuqs';
import type { CategoryId } from '@/entities/category/model/category';
import { DEFAULT_PRODUCT_LIST_QUERY, type ProductSort } from '@/entities/product/model/product';
import { productSearchParams } from './productSearchParams';

/* AI-generated : week06-advanced-b.md 2단계 기준 */
export function useProductListParams() {
  const [param, setParam] = useQueryStates(productSearchParams, { history: 'push', scroll: true });

  /* AI-generated : Week 7 Part 2 — 검색은 디바운스(300ms)로 입력 중에 계속 발생하는데, scroll:true면 그때마다
     페이지가 맨 위로 튀어 검색창 자체가 시야에서 밀려난다. 검색에서만 scroll:false로 현재 스크롤을 유지한다.
     페이지 이동(setPage)은 새 페이지를 처음부터 보는 게 자연스러워 scroll:true를 그대로 둔다 */
  // 디바운스로 계속 갱신되는 검색어는 매번 push하면 히스토리가 스팸처럼 쌓여서, replace로 덮어쓴다
  const setQuery = (q: string) => setParam({ q, page: 1 }, { history: 'replace', scroll: false });
  const setCategory = (category: CategoryId | 'all') => setParam({ category, page: 1 });
  const setSort = (sort: ProductSort) => setParam({ sort, page: 1 });
  const setPage = (page: number) => setParam({ page });
  const resetQuery = () => setParam(DEFAULT_PRODUCT_LIST_QUERY);

  return { ...param, setQuery, setCategory, setSort, setPage, resetQuery };
}
